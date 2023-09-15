import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CacheInfo } from "src/utils/cache.info";
import { MexToken } from "./entities/mex.token";
import { MexPairService } from "./mex.pair.service";
import { MexPairState } from "./entities/mex.pair.state";
import { MexPair } from "./entities/mex.pair";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { MexFarmService } from "./mex.farm.service";
import { MexSettingsService } from "./mex.settings.service";
import { Constants } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { QueryPagination } from "src/common/entities/query.pagination";

@Injectable()
export class MexTokenService {
  private readonly logger = new OriginLogger(MexTokenService.name);

  constructor(
    private readonly cachingService: CacheService,
    private readonly apiConfigService: ApiConfigService,
    private readonly mexPairService: MexPairService,
    @Inject(forwardRef(() => MexFarmService))
    private readonly mexFarmService: MexFarmService,
    private readonly mexSettingsService: MexSettingsService,
  ) { }

  async refreshMexTokens(): Promise<void> {
    const tokens = await this.getAllMexTokensRaw();
    await this.cachingService.setRemote(CacheInfo.MexTokens.key, tokens, CacheInfo.MexTokens.ttl);
    await this.cachingService.setLocal(CacheInfo.MexTokens.key, tokens, Constants.oneSecond() * 30);

    const indexedTokens = await this.getIndexedMexTokensRaw();
    await this.cachingService.setRemote(CacheInfo.MexTokensIndexed.key, indexedTokens, CacheInfo.MexTokensIndexed.ttl);
    await this.cachingService.setLocal(CacheInfo.MexTokensIndexed.key, indexedTokens, Constants.oneSecond() * 30);

    const indexedPrices = await this.getMexPricesRaw();
    await this.cachingService.setRemote(CacheInfo.MexPrices.key, indexedPrices, CacheInfo.MexPrices.ttl);
    await this.cachingService.setLocal(CacheInfo.MexPrices.key, indexedPrices, Constants.oneSecond() * 30);
  }

  async getMexTokens(queryPagination: QueryPagination): Promise<MexToken[]> {
    const { from, size } = queryPagination;
    let allMexTokens = await this.getAllMexTokens();
    allMexTokens = JSON.parse(JSON.stringify(allMexTokens));

    return allMexTokens.slice(from, from + size);
  }

  async getMexTokenByIdentifier(identifier: string): Promise<MexToken | undefined> {
    const mexTokens = await this.getAllMexTokens();
    return mexTokens.find(x => x.id === identifier);
  }

  async getMexPrices(): Promise<Record<string, { price: number, isToken: boolean }>> {
    return await this.cachingService.getOrSet(
      CacheInfo.MexPrices.key,
      async () => await this.getMexPricesRaw(),
      CacheInfo.MexPrices.ttl,
      Constants.oneSecond() * 30
    );
  }

  async getMexPricesRaw(): Promise<Record<string, { price: number, isToken: boolean }>> {
    try {
      const result: Record<string, { price: number, isToken: boolean }> = {};

      const tokens = await this.getAllMexTokens();
      for (const token of tokens) {
        result[token.id] = {
          price: token.price,
          isToken: true,
        };
      }

      const pairs = await this.mexPairService.getAllMexPairs();
      for (const pair of pairs) {
        result[pair.id] = {
          price: pair.price,
          isToken: false,
        };
      }

      const farms = await this.mexFarmService.getAllMexFarms();
      for (const farm of farms) {
        result[farm.id] = {
          price: farm.price,
          isToken: false,
        };
      }

      const settings = await this.mexSettingsService.getSettings();
      if (settings) {
        const mexToken = tokens.find(x => x.symbol === 'MEX');
        if (mexToken) {
          const lkmexIdentifier = settings.lockedAssetIdentifier;
          if (lkmexIdentifier) {
            result[lkmexIdentifier] = {
              price: mexToken.price,
              isToken: false,
            };
          }

          const xmexIdentifier = settings.lockedAssetIdentifierV2;
          if (xmexIdentifier) {
            result[xmexIdentifier] = {
              price: mexToken.price,
              isToken: false,
            };
          }
        }
      }

      return result;
    } catch (error) {
      this.logger.error('An error occurred while fetching mex prices');
      this.logger.error(error);
      return {};
    }
  }

  async getIndexedMexTokens(): Promise<Record<string, MexToken>> {
    if (!this.apiConfigService.getExchangeServiceUrl()) {
      return {};
    }

    return await this.cachingService.getOrSet(
      CacheInfo.MexTokensIndexed.key,
      async () => await this.getIndexedMexTokensRaw(),
      CacheInfo.MexTokensIndexed.ttl,
      Constants.oneSecond() * 30
    );
  }

  async getIndexedMexTokensRaw(): Promise<Record<string, MexToken>> {
    const result: Record<string, MexToken> = {};

    const tokens = await this.getAllMexTokens();
    for (const token of tokens) {
      result[token.id] = token;
    }

    return result;
  }

  async getMexTokensCount(): Promise<number> {
    const mexTokens = await this.getAllMexTokens();

    return mexTokens.length;
  }

  private async getAllMexTokens(): Promise<MexToken[]> {
    if (!this.apiConfigService.getExchangeServiceUrl()) {
      return [];
    }

    return await this.cachingService.getOrSet(
      CacheInfo.MexTokens.key,
      async () => await this.getAllMexTokensRaw(),
      CacheInfo.MexTokens.ttl,
      Constants.oneSecond() * 30
    );
  }

  private async getAllMexTokensRaw(): Promise<MexToken[]> {
    const pairs = await this.mexPairService.getAllMexPairs();
    const filteredPairs = pairs.filter(x => x.state === MexPairState.active);

    const mexTokens: MexToken[] = [];
    for (const pair of filteredPairs) {
      if (pair.baseSymbol === 'WEGLD' && pair.quoteSymbol === "USDC") {
        const wegldToken = new MexToken();
        wegldToken.id = pair.baseId;
        wegldToken.symbol = pair.baseSymbol;
        wegldToken.name = pair.baseName;
        wegldToken.price = pair.basePrice;

        mexTokens.push(wegldToken);
      }

      const mexToken = this.getMexToken(pair);
      if (!mexToken) {
        continue;
      }

      mexTokens.push(mexToken);
    }

    return mexTokens.distinct(x => x.id);
  }

  private getMexToken(pair: MexPair): MexToken | null {
    if (pair.baseSymbol === 'WEGLD' && pair.quoteSymbol === "USDC") {
      return {
        id: pair.quoteId,
        symbol: pair.quoteSymbol,
        name: pair.quoteName,
        price: pair.quotePrice,
      };
    }

    if (['WEGLD', 'USDC'].includes(pair.quoteSymbol)) {
      return {
        id: pair.baseId,
        symbol: pair.baseSymbol,
        name: pair.baseName,
        price: pair.basePrice,
      };
    }

    if (['WEGLD', 'USDC'].includes(pair.baseSymbol)) {
      return {
        id: pair.quoteId,
        symbol: pair.quoteSymbol,
        name: pair.quoteName,
        price: pair.quotePrice,
      };
    }

    return null;
  }
}
