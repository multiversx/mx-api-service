import { Injectable } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { Constants } from "src/utils/constants";
import { MexToken } from "./entities/mex.token";
import { MexPairsService } from "./mex.pairs.service";
import { MexPairState } from "./entities/mex.pair.state";
import { MexPair } from "./entities/mex.pair";

@Injectable()
export class MexTokenService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly mexPairsService: MexPairsService,
  ) { }

  async refreshMexTokens(): Promise<void> {
    const pairs = await this.getAllMexTokensRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexTokens.key, pairs, CacheInfo.MexTokens.ttl);
  }

  async getMexTokens(from: number, size: number): Promise<MexToken[]> {
    const allMexTokens = await this.getAllMexTokens();

    return allMexTokens.slice(from, from + size);
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

    const tokens = await this.getAllMexTokensRaw();
    for (const token of tokens) {
      result[token.symbol] = token;
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
    const pairs = await this.mexPairsService.getAllMexPairsRaw();
    const filteredPairs = pairs.filter(x => x.state === MexPairState.active);

    const mexTokens: MexToken[] = [];
    for (const pair of filteredPairs) {
      if (pair.baseSymbol === 'WEGLD' && pair.quoteSymbol === "USDC") {
        const wegldToken = new MexToken();
        wegldToken.symbol = pair.baseId;
        wegldToken.name = pair.baseName;
        wegldToken.price = pair.basePrice;

        const usdcToken = new MexToken();
        usdcToken.symbol = pair.quoteId;
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
        symbol: pair.baseId,
        name: pair.baseName,
        price: pair.basePrice,
      };
    }

    if (pair.baseSymbol === 'WEGLD') {
      return {
        symbol: pair.quoteSymbol,
        name: pair.quoteName,
        price: pair.quotePrice,
      };
    }

    return null;
  }
}
