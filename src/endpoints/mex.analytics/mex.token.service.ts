import { Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { Constants } from "src/utils/constants";
import { MexToken } from "./entities/mex.token";

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

    return result.map((pair: any) => this.getMexToken(pair));
  }

  private getMexToken(pair: any): MexToken {
    const firstTokenSymbol = pair.firstToken.identifier.split('-')[0];
    const secondTokenSymbol = pair.secondToken.identifier.split('-')[0];

    if ((firstTokenSymbol === 'WEGLD' && secondTokenSymbol === 'USDC') || secondTokenSymbol === 'WEGLD') {
      return {
        token: pair.firstToken.identifier,
        name: pair.firstToken.name,
        priceUsd: Number(pair.firstTokenPriceUSD),
        priceEgld: Number(pair.firstTokenPrice),
      };
    }

    return {
      token: pair.secondToken.identifier,
      name: pair.secondToken.name,
      priceUsd: Number(pair.secondTokenPriceUSD),
      priceEgld: Number(pair.secondTokenPrice),
    };
  }
}
