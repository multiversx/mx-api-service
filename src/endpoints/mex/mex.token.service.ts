import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { Constants } from "src/utils/constants";
import { MexToken } from "./entities/mex.token";
import { MexPairService } from "./mex.pair.service";
import { MexPairState } from "./entities/mex.pair.state";
import { MexPair } from "./entities/mex.pair";
import { MexFarmService } from "./mex.farm.service";

@Injectable()
export class MexTokenService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly mexPairService: MexPairService,
    @Inject(forwardRef(() => MexFarmService))
    private readonly mexFarmService: MexFarmService,
  ) { }

  async refreshMexTokens(): Promise<void> {
    const tokens = await this.getAllMexTokensRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexTokens.key, tokens, CacheInfo.MexTokens.ttl);
    await this.cachingService.setCacheLocal(CacheInfo.MexTokens.key, tokens, Constants.oneSecond() * 30);
  }

  async getMexTokens(from: number, size: number): Promise<MexToken[]> {
    const allMexTokens = await this.getAllMexTokens();

    return allMexTokens.slice(from, from + size);
  }

  async getMexPrices(): Promise<Record<string, number>> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.MexPrices.key,
      async () => await this.getMexPricesRaw(),
      CacheInfo.MexPrices.ttl,
      Constants.oneSecond() * 30
    );
  }

  async getMexPricesRaw(): Promise<Record<string, number>> {
    const result: Record<string, number> = {};

    const tokens = await this.getAllMexTokens();
    for (const token of tokens) {
      result[token.id] = token.price;
    }

    const pairs = await this.mexPairService.getAllMexPairs();
    for (const pair of pairs) {
      result[pair.id] = pair.price;
    }

    const farms = await this.mexFarmService.getAllMexFarms();
    for (const farm of farms) {
      result[farm.id] = farm.price;
    }

    return result;
  }

  async getIndexedMexTokens(): Promise<Record<string, MexToken>> {
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
    if (pair.quoteSymbol === 'WEGLD') {
      return {
        id: pair.baseId,
        symbol: pair.baseSymbol,
        name: pair.baseName,
        price: pair.basePrice,
      };
    }

    if (pair.baseSymbol === 'WEGLD') {
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
