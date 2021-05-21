import { Injectable } from "@nestjs/common";
import axios from "axios";
import { ApiConfigService } from "../../helpers/api.config.service";
import { CachingService } from "../../helpers/caching.service";
import {  oneHour } from "../../helpers/helpers";

@Injectable()
export class VmQueryService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
  ) {}

  async vmQueryFullResult(contract: string, func: string, caller: string | undefined = undefined, args: string[] = []): Promise<any> {
    let key = `vm-query:${contract}:${func}`;
    if (caller) {
      key += `:${caller}`;
    }

    if (args.length > 0) {
      key += `@${args.join('@')}`;
    }

    let isCachingQueryFunction = await this.cachingService.isCachingQueryFunction(contract, func);
    let ttl = isCachingQueryFunction ? oneHour() : 6;

    return await this.cachingService.getOrSetCache(
      key,
      async () => await this.vmQueryRaw(contract, func, caller, args),
      ttl
    );
  }

  async vmQuery(contract: string, func: string, caller: string | undefined = undefined, args: string[] = []): Promise<string[]> {
    let key = `vm-query:${contract}:${func}`;
    if (caller) {
      key += `:${caller}`;
    }

    if (args.length > 0) {
      key += `@${args.join('@')}`;
    }

    let isCachingQueryFunction = await this.cachingService.isCachingQueryFunction(contract, func);
    let secondsRemainingUntilNextRound = await this.cachingService.getSecondsRemainingUntilNextRound();

    let localTtl = isCachingQueryFunction ? oneHour() : secondsRemainingUntilNextRound;

    // no need to store value remotely just to evict it one second later
    let remoteTtl = localTtl > 1 ? localTtl : 0;

    try {
      let result = await this.cachingService.getOrSetCache(
        key,
        async () => await this.vmQueryRaw(contract, func, caller, args),
        remoteTtl,
        localTtl
      );

      let data = result.data.data;

      return 'ReturnData' in data ? data.ReturnData : data.returnData;
    } catch (error) {
      console.error(`Error in vm query for address '${contract}', function '${func}', caller '${caller}', args '${JSON.stringify(args)}'. Error message: ${error.response?.data?.error}`);
      throw error;
    }
  }

  async vmQueryRaw(contract: string, func: string, caller: string | undefined, args: string[] = []): Promise<any> {
    let payload = { 
      scAddress: contract, 
      FuncName: func, 
      caller: caller, 
      args: args,
    };

    let result = await axios.post(
      `${this.apiConfigService.getVmQueryUrl()}/vm-values/query`,
      payload,
    );

    return result.data;
  };
}