import { CACHE_MANAGER, Inject, Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "./api.config.service";
const { promisify } = require('util');
import { createClient } from 'redis';
import asyncPool from 'tiny-async-pool';
import { CachedFunction } from "src/crons/entities/cached.function";
import { InvalidationFunction } from "src/crons/entities/invalidation.function";
import { hexToString, isSmartContractAddress, oneWeek } from "./helpers";
import { PerformanceProfiler } from "./performance.profiler";
import { ShardTransaction } from "src/crons/entities/shard.transaction";
import { Cache } from "cache-manager";
import { RoundService } from "src/endpoints/rounds/round.service";

@Injectable()
export class CachingService {
  private client = createClient(6379, this.configService.getRedisUrl());
  private asyncSet = promisify(this.client.set).bind(this.client);
  private asyncGet = promisify(this.client.get).bind(this.client);
  // private asyncMSet = promisify(this.client.mset).bind(this.client);
  private asyncMGet = promisify(this.client.mget).bind(this.client);
  private asyncMulti = (commands: any[]) => {
    const multi = this.client.multi(commands);
    return promisify(multi.exec).call(multi);
  };
    
  caching: { [key: string] : CachedFunction[] } = {
    // 'erd1qqqqqqqqqqqqqpgqta8u7qyngjttwu9cmh7uvskaentglrqlerms7a3gys': [
    //   { 
    //     funcName: 'getQuorum', 
    //     invalidations: [
    //       {
    //         funcName: 'performAction',
    //         args: []
    //       }
    //     ]
    //   },
    //   { 
    //     funcName: 'getNumBoardMembers', 
    //     invalidations: [
    //       {
    //         funcName: 'performAction',
    //         args: []
    //       }
    //     ]
    //   },
    //   { 
    //     funcName: 'getNumProposers', 
    //     invalidations: [
    //       {
    //         funcName: 'performAction',
    //         args: []
    //       }
    //     ]
    //   },
    //   { 
    //     funcName: 'userRole', 
    //     invalidations: [
    //       {
    //         funcName: 'performAction',
    //         args: [
    //           { index: undefined, value: '*' }
    //         ]
    //       }
    //     ]
    //   },
    //   { 
    //     funcName: 'getPendingActionFullInfo', 
    //     invalidations: [
    //       {
    //         funcName: '*',
    //         args: []
    //       },
    //     ]
    //   },
    // ],
    // 'erd1qqqqqqqqqqqqqpgqjsq7r0vsemjxxyruh4scgut3jgc6dtasermsq7ejx9': [
    //   {
    //     funcName: 'getMultisigContractName',
    //     invalidations: []
    //   }
    // ],
    // '/uYNe6O98aIOSpF57HocNxS4JQ7FILx6+N7MEN3oAQY=': [

    // ]
  };

  private asyncDel = promisify(this.client.del).bind(this.client);
  private asyncKeys = promisify(this.client.keys).bind(this.client);

  private static cache: Cache;

  private readonly logger: Logger

  constructor(
    private readonly configService: ApiConfigService,
    @Inject(CACHE_MANAGER)
    cache: Cache,
    private readonly roundService: RoundService,
  ) {
    CachingService.cache = cache;
    this.logger = new Logger(CachingService.name);
  }

  private async setCacheRemote<T>(key: string, value: T, ttl: number = this.configService.getCacheTtl()): Promise<T> {
    await this.asyncSet(key, JSON.stringify(value), 'EX', ttl ?? this.configService.getCacheTtl());
    return value;
  };

  pendingGetRemotes: { [key: string]: Promise<any> } = {};

  private async getCacheRemote<T>(key: string): Promise<T | undefined> {
    let response;

    let pendingGetRemote = this.pendingGetRemotes[key];
    if (pendingGetRemote) {
      response = await pendingGetRemote;
    } else {
      pendingGetRemote = this.asyncGet(key);

      this.pendingGetRemotes[key] = pendingGetRemote;

      response = await pendingGetRemote;

      delete this.pendingGetRemotes[key];
    }

    if (response === undefined) {
      return undefined;
    }

    return JSON.parse(response);
  };

  async setCacheLocal<T>(key: string, value: T, ttl: number = this.configService.getCacheTtl()): Promise<T> {
    return await CachingService.cache.set<T>(key, value, { ttl });
  }

  async getCacheLocal<T>(key: string): Promise<T | undefined> {
    return await CachingService.cache.get<T>(key);
  }

  public async getCache<T>(key: string): Promise<T | undefined> {
    let value = await this.getCacheLocal<T>(key);
    if (value) {
      return value;
    }

    return await this.getCacheRemote<T>(key);
  }

  public async setCache<T>(key: string, value: T, ttl: number = this.configService.getCacheTtl()): Promise<T> {
    await this.setCacheLocal<T>(key, value, ttl);
    await this.setCacheRemote<T>(key, value, ttl);
    return value;
  }

  async batchProcess<IN, OUT>(payload: IN[], cacheKeyFunction: (element: IN) => string, handler: (generator: IN) => Promise<OUT>, ttl: number = this.configService.getCacheTtl(), skipCache: boolean = false): Promise<OUT[]> {
    let result: OUT[] = [];

    let chunks = this.getChunks(payload, 100);

    for (let [_, chunk] of chunks.entries()) {
      // this.logger.log(`Loading ${index + 1} / ${chunks.length} chunks`);

      let retries = 0;
      while (true) {
        try {
          let processedChunk = await this.batchProcessChunk(chunk, cacheKeyFunction, handler, ttl, skipCache);
          result.push(...processedChunk);
          break;
        } catch (error) {
          this.logger.error(error);
          this.logger.log(`Retries: ${retries}`);
          retries++;
          if (retries >= 3) {
            throw error;
          }
        }
      }
    }

    return result;
  }

  async batchProcessChunk<IN, OUT>(payload: IN[], cacheKeyFunction: (element: IN) => string, handler: (generator: IN) => Promise<OUT>, ttl: number = this.configService.getCacheTtl(), skipCache: boolean = false): Promise<OUT[]> {
    const keys = payload.map(element => cacheKeyFunction(element));

    let cached: OUT[] = [];
    if (skipCache) {
      cached = new Array(keys.length).fill(null);
    } else {
      cached = await this.batchGetCache(keys);
    }
  
    const missing = cached
      .map((element, index) => (element === null ? index : false))
      .filter((element) => element !== false)
      .map(element => element as number);

    let values: OUT[] = [];
  
    if (missing.length) {
      values = await asyncPool(
        this.configService.getPoolLimit(),
        missing.map((index) => payload[index]),
        handler
      );

      const params = {
        keys: keys.filter((_, index) => missing.includes(index)),
        values,
        ttls: values.map((value) => (value ? ttl : Math.min(ttl, this.configService.getProcessTtl()))),
      };
  
      await this.batchSetCache(params.keys, params.values, params.ttls);
    }

    return keys.map((_, index) =>
      missing.includes(index) ? values[missing.indexOf(index)] : cached[index]
    );
  }

  private spreadTtl(ttl: number): number {
    const threshold = 300; // seconds after which to start spreading ttls
    const spread = 10; // percent ttls spread
  
    if (ttl >= threshold) {
      const sign = Math.round(Math.random()) * 2 - 1;
      const amount = Math.floor(Math.random() * ((ttl * spread) / 100));
  
      ttl = ttl + sign * amount;
    }
  
    return ttl;
  };

  async batchSetCache(keys: string[], values: any[], ttls: number[]) {
    if (!ttls) {
      ttls = new Array(keys.length).fill(this.configService.getCacheTtl());
    }

    ttls = ttls.map(ttl => this.spreadTtl(ttl));

    for (let [index, key] of keys.entries()) {
      let value = values[index];
      let ttl = ttls[index];

      this.setCacheLocal(key, value, ttl);
    }

  
    const chunks = this.getChunks(
      keys.map((key, index) => {
        const element: any = {};
        element[key] = index;
        return element;
      }, 25)
    );
  
    const sets = [];
  
    for (const chunk of chunks) {
      const chunkKeys = chunk.map((element: any) => Object.keys(element)[0]);
      const chunkValues = chunk.map((element: any) => values[Object.values(element)[0] as number]);
  
      sets.push(
        ...chunkKeys.map((key: string, index: number) => {
          return ['set', key, JSON.stringify(chunkValues[index]), 'ex', ttls[index]];
        })
      );
    }
  
    await this.asyncMulti(sets);
  };

  private getChunks<T>(array: T[], size = 25): T[][] {
    return array.reduce((result: T[][], item, current) => {
      const index = Math.floor(current / size);
  
      if (!result[index]) {
        result[index] = [];
      }
  
      result[index].push(item);
  
      return result;
    }, []);
  };
  
  async batchGetCache<T>(keys: string[]): Promise<T[]> {
    const chunks = this.getChunks(keys, 100);
  
    const result = [];
  
    for (const chunkKeys of chunks) {
      let chunkValues = await this.asyncMGet(chunkKeys);
  
      chunkValues = chunkValues.map((value: any) => (value ? JSON.parse(value) : null));
  
      result.push(...chunkValues);
    }
  
    return result;
  };

  async getOrSetCache<T>(key: string, promise: () => Promise<T>, remoteTtl: number = this.configService.getCacheTtl(), localTtl: number | undefined = undefined): Promise<T> {
    if (!localTtl) {
      localTtl = remoteTtl / 2;
    }

    let profiler = new PerformanceProfiler(`vmQuery:${key}`);

    let cachedValue = await this.getCacheLocal<T>(key);
    if (cachedValue !== undefined) {
        profiler.stop(`Local Cache hit for key ${key}`);
        return cachedValue;
    }

    let cached = await this.getCacheRemote<T>(key);
    if (cached !== undefined && cached !== null) {
      profiler.stop(`Remote Cache hit for key ${key}`);

      // we only set ttl to half because we don't know what the real ttl of the item is and we want it to work good in most scenarios
      await this.setCacheLocal<T>(key, cached, localTtl);
      return cached;
    }

    let value = await promise();
    profiler.stop(`Cache miss for key ${key}`);

    if (localTtl > 0) {
      await this.setCacheLocal<T>(key, value, localTtl);
    }

    if (remoteTtl > 0) {
      await this.setCacheRemote<T>(key, value, remoteTtl);
    }
    return value;
  }

  async deleteInCacheLocal(key: string) {
    await CachingService.cache.del(key);
  }

  async deleteInCache(key: string): Promise<string[]> {
    let invalidatedKeys = [];

    if (key.includes('*')) {
      let allKeys = await this.asyncKeys(key);
      for (let key of allKeys) {
        // this.logger.log(`Invalidating key ${key}`);
        await CachingService.cache.del(key);
        await this.asyncDel(key);
        invalidatedKeys.push(key);
      }
    } else {
      // this.logger.log(`Invalidating key ${key}`);
      await CachingService.cache.del(key);
      await this.asyncDel(key);
      invalidatedKeys.push(key);
    }

    return invalidatedKeys;
  }

  async tryInvalidateTransaction(transaction: ShardTransaction): Promise<string[]> {
    let keys = await this.getInvalidationKeys(transaction);
    let invalidatedKeys = [];
    for (let key of keys) {
      let invalidationKey = `vm-query:${transaction.receiver}:${key}`;
      let invalidated = await this.deleteInCache(invalidationKey);
      invalidatedKeys.push(...invalidated);
    }

    return invalidatedKeys;
  }

  async tryInvalidateTokens(transaction: ShardTransaction): Promise<string[]> {
    if (transaction.receiver !== this.configService.getEsdtContractAddress()) {
      return [];
    }

    let transactionFuncName = transaction.getDataFunctionName();

    // if transaction target is ESDT SC and functionName is "issue", kick out 'allTokens' key
    if (transactionFuncName === 'issue') {
      return await this.deleteInCache('allTokens');
    }

    return [];
  }

  async tryInvalidateTokenProperties(transaction: ShardTransaction): Promise<string[]> {
    if (transaction.receiver !== this.configService.getEsdtContractAddress()) {
      return [];
    }

    let transactionFuncName = transaction.getDataFunctionName();

    if (transactionFuncName === 'controlChanges') {
      let args = transaction.getDataArgs();
      if (args && args.length > 0) {
        let tokenIdentifier = hexToString(args[0]);
        this.logger.log(`Invalidating token properties for token ${tokenIdentifier}`);
        return await this.deleteInCache(`tokenProperties:${tokenIdentifier}`);
      }
    }

    return [];
  }

  async tryInvalidateTokensOnAccount(transaction: ShardTransaction): Promise<string[]> {
    if (transaction.sender !== this.configService.getEsdtContractAddress()) {
      return [];
    }

    return await this.deleteInCache(`tokens:${transaction.receiver}`);
  }

  async tryInvalidateTokenBalance(transaction: ShardTransaction): Promise<string[]> {
    let transactionFuncName = transaction.getDataFunctionName();
    if (transactionFuncName === 'ESDTTransfer') {
      let invalidatedKeys = [];
      let invalidated = await this.deleteInCache(`tokens:${transaction.sender}`);
      invalidatedKeys.push(...invalidated);

      invalidated = await this.deleteInCache(`tokens:${transaction.receiver}`);
      invalidatedKeys.push(...invalidated);
    }

    return [];
  }

  private async getInvalidationKeys(transaction: ShardTransaction): Promise<string[]> {
    if (!isSmartContractAddress(transaction.receiver)) {
      return [];
    }

    let cachedFunctions = await this.getCachedFunctions(transaction.receiver);
    if (!cachedFunctions) {
      return [];
    }

    if (transaction.data === undefined) {
      return [];
    }

    let transactionFuncName = transaction.getDataFunctionName();
    let transactionArgs = transaction.getDataArgs();

    if (!transactionFuncName || !transactionArgs) {
      return [];
    }

    let keys: string[] = [];

    for (let cachedFunction of cachedFunctions) {
      for (let invalidation of cachedFunction.invalidations) {
        if (invalidation.funcName === transactionFuncName || invalidation.funcName === "*") {
          let key = this.getInvalidationKey(cachedFunction.funcName, invalidation, transactionArgs);
          keys.push(key);
        }
      }
    }

    // if transaction target is ESDT SC and functionName is "issue", kick out 'allTokens' key
    if (transaction.receiver === this.configService.getEsdtContractAddress() && transactionFuncName === 'issue') {
      this.deleteInCache('allTokens');
    }

    return keys;
  }

  private getInvalidationKey(funcName: string, invalidationFunction: InvalidationFunction, transactionArgs: string[]) {
    let argComponents: string[] = [];

    for (let arg of invalidationFunction.args) {
      if (arg.index !== undefined) {
        argComponents.push(transactionArgs[arg.index]);
      } else if (arg.value !== undefined) {
        argComponents.push(arg.value);
      }
    }

    let result = funcName;
    if (argComponents.length > 0) {
      result += '@' + argComponents.join('@');
    }

    return result;
  }

  async getCachedFunctions(contract: string): Promise<CachedFunction[] | undefined> {
    let cachedFunctions = this.caching[contract];
    // if (!cachedFunctions) {
    //   let accountCodeHash = await this.accountService.getAccountCodeHash(contract);
    //   if (!accountCodeHash) {
    //     return [];
    //   }

    //   cachedFunctions = this.caching[accountCodeHash];
    // }

    return cachedFunctions;
  }

  async isCachingQueryFunction(contract: string, func: string): Promise<boolean> {
    let cachedFunctions = await this.getCachedFunctions(contract);
    if (!cachedFunctions) {
      return false;
    }

    for (let cachedFunction of cachedFunctions) {
      if (cachedFunction.funcName === func) {
        return true;
      }
    }

    return false;
  }

  async getSecondsRemainingUntilNextRound(): Promise<number> {
    let genesisTimestamp = await this.getGenesisTimestamp();
    let currentTimestamp = Math.round(Date.now() / 1000);

    let result = 6 - (currentTimestamp - genesisTimestamp) % 6;
    if (result === 6) {
      result = 0;
    }

    return result;
  }

  private async getGenesisTimestamp(): Promise<number> {
    return await this.getOrSetCache(
      'genesisTimestamp',
      async () => await this.getGenesisTimestampRaw(),
      oneWeek(),
      oneWeek()
    );
  }

  private async getGenesisTimestampRaw(): Promise<number> {
    try {
      let round = await this.roundService.getRound(0, 1);
      return round.timestamp;
    } catch (error) {
      this.logger.error(error);
      return 0;
    }
  }
}