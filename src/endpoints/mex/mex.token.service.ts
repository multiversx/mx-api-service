import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { CacheInfo } from "src/utils/cache.info";
import { MexToken } from "./entities/mex.token";
import { MexPairService } from "./mex.pair.service";
import { MexPairState } from "./entities/mex.pair.state";
import { MexPair } from "./entities/mex.pair";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { MexFarmService } from "./mex.farm.service";
import { MexSettingsService } from "./mex.settings.service";
import { Constants, CachingService } from "@elrondnetwork/erdnest";
import { MexPairType } from "./entities/mex.pair.type";

@Injectable()
export class MexTokenService {
  private readonly logger: Logger;

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService,
    private readonly mexPairService: MexPairService,
    @Inject(forwardRef(() => MexFarmService))
    private readonly mexFarmService: MexFarmService,
    private readonly mexSettingsService: MexSettingsService,
  ) {
    this.logger = new Logger(MexTokenService.name);
  }

  async refreshMexTokens(): Promise<void> {
    const tokens = await this.getAllMexTokensRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexTokens.key, tokens, CacheInfo.MexTokens.ttl);
    await this.cachingService.setCacheLocal(CacheInfo.MexTokens.key, tokens, Constants.oneSecond() * 30);

    const indexedTokens = await this.getIndexedMexTokensRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexTokensIndexed.key, indexedTokens, CacheInfo.MexTokensIndexed.ttl);
    await this.cachingService.setCacheLocal(CacheInfo.MexTokensIndexed.key, indexedTokens, Constants.oneSecond() * 30);

    const indexedPrices = await this.getMexPricesRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexPrices.key, indexedPrices, CacheInfo.MexPrices.ttl);
    await this.cachingService.setCacheLocal(CacheInfo.MexPrices.key, indexedPrices, Constants.oneSecond() * 30);
  }

  async getMexTokens(from: number, size: number): Promise<MexToken[]> {
    const allMexTokens = await this.getAllMexTokens();

    return allMexTokens.slice(from, from + size);
  }

  async getMexPrices(): Promise<Record<string, { price: number, isToken: boolean }>> {
    return await this.cachingService.getOrSetCache(
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
        const lkmexIdentifier = settings.lockedAssetIdentifier;
        if (lkmexIdentifier) {
          const mexToken = tokens.find(x => x.symbol === 'MEX');
          if (mexToken) {
            result[lkmexIdentifier] = {
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
    if (!this.apiConfigService.getMaiarExchangeUrl()) {
      return {};
    }

    return await this.cachingService.getOrSetCache(
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

  private async getAllMexTokens(): Promise<MexToken[]> {
    if (!this.apiConfigService.getMaiarExchangeUrl()) {
      return [];
    }

    return await this.cachingService.getOrSetCache(
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

        const usdcToken = new MexToken();
        usdcToken.id = pair.quoteId;
        usdcToken.symbol = pair.quoteSymbol;
        usdcToken.name = pair.quoteName;
        usdcToken.price = 1;

        mexTokens.push(wegldToken);
        mexTokens.push(usdcToken);

        continue;
      }

      const mexToken = this.getMexToken(pair);
      if (!mexToken) {
        continue;
      }

      mexTokens.push(mexToken);
    }

    return mexTokens;
  }

  private getMexToken(pair: MexPair): MexToken | null {
    if ((pair.type !== MexPairType.jungle && pair.quoteSymbol === 'WEGLD') ||
      (pair.type === MexPairType.jungle && pair.quoteSymbol === 'USDC')) {
      return {
        id: pair.baseId,
        symbol: pair.baseSymbol,
        name: pair.baseName,
        price: pair.basePrice,
      };
    }

    if ((pair.type !== MexPairType.jungle && pair.baseSymbol === 'WEGLD') ||
      (pair.type === MexPairType.jungle && pair.baseSymbol === 'USDC')) {
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
