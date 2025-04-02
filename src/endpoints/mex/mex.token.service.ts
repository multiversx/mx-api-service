import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { CacheInfo } from "src/utils/cache.info";
import { MexToken } from "./entities/mex.token";
import { MexPairService } from "./mex.pair.service";
import { MexPair } from "./entities/mex.pair";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { MexFarmService } from "./mex.farm.service";
import { MexSettingsService } from "./mex.settings.service";
import { Constants } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { MexTokenType } from "./entities/mex.token.type";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { tokensQuery } from "./graphql/tokens.query";

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
    private readonly graphQlService: GraphQlService,
  ) { }

  async refreshMexTokens(): Promise<void> {
    const tokens = await this.getAllMexTokensRaw();
    await this.cachingService.setRemote(CacheInfo.MexTokens.key, tokens, CacheInfo.MexTokens.ttl);
    this.cachingService.setLocal(CacheInfo.MexTokens.key, tokens, Constants.oneSecond() * 30);

    const tokenTypes = await this.getAllMexTokenTypesRaw();
    await this.cachingService.setRemote(CacheInfo.MexTokenTypes.key, tokenTypes, CacheInfo.MexTokenTypes.ttl);
    this.cachingService.setLocal(CacheInfo.MexTokenTypes.key, tokenTypes, Constants.oneSecond() * 30);

    const indexedTokens = await this.getIndexedMexTokensRaw();
    await this.cachingService.setRemote(CacheInfo.MexTokensIndexed.key, indexedTokens, CacheInfo.MexTokensIndexed.ttl);
    this.cachingService.setLocal(CacheInfo.MexTokensIndexed.key, indexedTokens, Constants.oneSecond() * 30);

    const indexedPrices = await this.getMexPricesRaw();
    await this.cachingService.setRemote(CacheInfo.MexPrices.key, indexedPrices, CacheInfo.MexPrices.ttl);
    this.cachingService.setLocal(CacheInfo.MexPrices.key, indexedPrices, Constants.oneSecond() * 30);
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

    const mexTokens: MexToken[] = [];
    for (const pair of pairs) {
      if (pair.baseSymbol === 'WEGLD' && pair.quoteSymbol === "USDC") {
        const wegldToken = new MexToken();
        wegldToken.id = pair.baseId;
        wegldToken.symbol = pair.baseSymbol;
        wegldToken.name = pair.baseName;
        wegldToken.price = pair.basePrice;
        wegldToken.previous24hPrice = pair.basePrevious24hPrice;
        wegldToken.previous24hVolume = pair.volume24h;
        wegldToken.tradesCount = this.computeTradesCountForMexToken(wegldToken, pairs);
        mexTokens.push(wegldToken);
      }

      const mexToken = this.getMexToken(pair);
      if (!mexToken) {
        continue;
      }

      mexToken.tradesCount = this.computeTradesCountForMexToken(mexToken, pairs);

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
        previous24hPrice: pair.quotePrevious24hPrice,
        previous24hVolume: pair.volume24h,
        tradesCount: 0,
      };
    }

    if (['WEGLD', 'USDC'].includes(pair.quoteSymbol)) {
      return {
        id: pair.baseId,
        symbol: pair.baseSymbol,
        name: pair.baseName,
        price: pair.basePrice,
        previous24hPrice: pair.basePrevious24hPrice,
        previous24hVolume: pair.volume24h,
        tradesCount: 0,
      };
    }

    if (['WEGLD', 'USDC'].includes(pair.baseSymbol)) {
      return {
        id: pair.quoteId,
        symbol: pair.quoteSymbol,
        name: pair.quoteName,
        price: pair.quotePrice,
        previous24hPrice: pair.quotePrevious24hPrice,
        previous24hVolume: pair.volume24h,
        tradesCount: 0,
      };
    }

    return null;
  }

  async getAllMexTokenTypes(): Promise<MexTokenType[]> {
    if (!this.apiConfigService.getExchangeServiceUrl()) {
      return [];
    }

    return await this.cachingService.getOrSet(
      CacheInfo.MexTokenTypes.key,
      async () => await this.getAllMexTokenTypesRaw(),
      CacheInfo.MexTokenTypes.ttl,
      Constants.oneSecond() * 30
    );
  }

  private async getAllMexTokenTypesRaw(): Promise<MexTokenType[]> {
    try {
      const settings = await this.mexSettingsService.getSettings();
      if (!settings) {
        throw new BadRequestException('Could not fetch MEX tokens');
      }

      const result: any = await this.graphQlService.getExchangeServiceData(tokensQuery);
      if (!result || !result.tokens) {
        return [];
      }

      return result.tokens.map((token: MexTokenType) => ({
        identifier: token.identifier,
        type: token.type.toLowerCase(),
      }));
    } catch (error) {
      this.logger.error('An error occurred while fetching all mex token types');
      this.logger.error(error);
      return [];
    }
  }

  private computeTradesCountForMexToken(mexToken: MexToken, filteredPairs: MexPair[]): number {
    const pairs = filteredPairs.filter(x => x.baseId === mexToken.id || x.quoteId === mexToken.id);
    const computeResult = pairs.sum(pair => pair.tradesCount ?? 0);
    return computeResult;
  }
}
