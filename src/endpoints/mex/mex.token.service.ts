import { Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { Constants } from "src/utils/constants";
import { MexToken } from "./entities/mex.token";
import BigNumber from "bignumber.js";

@Injectable()
export class MexTokenService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly graphQlService: GraphQlService
  ) { }

  async refreshMexTokens(): Promise<void> {
    const pairs = await this.getMexTokensRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexTokens.key, pairs, CacheInfo.MexTokens.ttl);
  }

  async getMexTokens(from: number, size: number): Promise<MexToken[]> {
    const allMexTokens = await this.getAllMexTokens();

    return allMexTokens.slice(from, from + size);
  }

  private async getAllMexTokens(): Promise<MexToken[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.MexTokens.key,
      async () => await this.getMexTokensRaw(),
      CacheInfo.MexTokens.ttl,
      Constants.oneSecond() * 30
    );
  }
  private async getMexTokensRaw(): Promise<MexToken[]> {
    const variables = {
      "offset": 0,
      "pairsLimit": 100,
    };

    const query = gql`
      query ($offset: Int, $pairsLimit: Int) {
        pairs(offset: $offset, limit: $pairsLimit) { 
          address 
          firstToken {
            name
            identifier
            decimals
            __typename
          }
          secondToken {
            name
            identifier
            decimals
            __typename
          }
          firstTokenPrice
          firstTokenPriceUSD
          secondTokenPrice
          secondTokenPriceUSD
        }
      }
    `;

    const result: any = await this.graphQlService.getData(query, variables);
    if (!result) {
      return [];
    }

    const mexTokens: MexToken[] = [];
    for (const pair of result.pairs) {
      const firstTokenSymbol = pair.firstToken.identifier.split('-')[0];
      const secondTokenSymbol = pair.secondToken.identifier.split('-')[0];
      if (firstTokenSymbol === 'WEGLD' && secondTokenSymbol === "USDC") {
        const wegldToken = new MexToken();
        wegldToken.token = pair.firstToken.identifier;
        wegldToken.name = pair.firstToken.name;
        wegldToken.priceUsd = new BigNumber(pair.firstTokenPriceUSD).toFixed();
        wegldToken.priceEgld = '1';

        const usdcToken = new MexToken();
        usdcToken.token = pair.secondToken.identifier;
        usdcToken.name = pair.secondToken.name;
        usdcToken.priceUsd = '1';
        usdcToken.priceEgld = new BigNumber(pair.secondTokenPrice).toFixed();

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

  private getMexToken(pair: any): MexToken | null {
    const firstTokenSymbol = pair.firstToken.identifier.split('-')[0];
    const secondTokenSymbol = pair.secondToken.identifier.split('-')[0];

    if (secondTokenSymbol === 'WEGLD') {
      return {
        token: pair.firstToken.identifier,
        name: pair.firstToken.name,
        priceUsd: new BigNumber(pair.firstTokenPriceUSD).toFixed(),
        priceEgld: new BigNumber(pair.firstTokenPrice).toFixed(),
      };
    }

    if (firstTokenSymbol === 'WEGLD') {
      return {
        token: pair.secondToken.identifier,
        name: pair.secondToken.name,
        priceUsd: new BigNumber(pair.secondTokenPriceUSD).toFixed(),
        priceEgld: new BigNumber(pair.secondTokenPrice).toFixed(),
      };
    }

    return null;
  }
}
