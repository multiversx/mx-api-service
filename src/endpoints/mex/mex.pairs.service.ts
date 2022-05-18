import { BadRequestException, Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { Constants } from "src/utils/constants";
import { MexPair } from "./entities/mex.pair";
import { MexPairState } from "./entities/mex.pair.state";
import { MexPairType } from "./entities/mex.pair.type";
import { MexSettingsService } from "./mex.settings.service";

@Injectable()
export class MexPairsService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly mexSettingService: MexSettingsService,
    private readonly graphQlService: GraphQlService,
  ) { }

  async refreshMexPairs(): Promise<void> {
    const pairs = await this.getAllMexPairsRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexPairs.key, pairs, CacheInfo.MexPairs.ttl);
  }

  async getMexPairs(from: number, size: number): Promise<any> {
    const allMexPairs = await this.getAllMexPairs();

    return allMexPairs.slice(from, from + size);
  }

  async getMexPair(baseId: string, quoteId: string): Promise<MexPair | undefined> {
    const allMexPairs = await this.getAllMexPairs();
    return allMexPairs.find(pair => pair.baseId === baseId && pair.quoteId === quoteId);
  }

  async getAllMexPairs(): Promise<MexPair[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.MexPairs.key,
      async () => await this.getAllMexPairsRaw(),
      CacheInfo.MexPairs.ttl,
      Constants.oneSecond() * 30
    );
  }

  async getAllMexPairsRaw(): Promise<MexPair[]> {
    const settings = await this.mexSettingService.getSettings();
    if (!settings) {
      throw new BadRequestException('Could not fetch MEX settings');
    }

    const variables = {
      "mexID": settings.mexId,
      "wegldID": settings.wegldId,
      "days": 7,
      "offset": 0,
      "pairsLimit": 100,
    };

    const query = gql`
      query ($days: Int!, $mexID: String!, $wegldID: String!, $offset: Int, $pairsLimit: Int) {
        totalAggregatedRewards(days: $days) 
        wegldPriceUSD: getTokenPriceUSD (tokenID: $wegldID)
        mexPriceUSD: getTokenPriceUSD(tokenID: $mexID)
        mexSupply: totalTokenSupply(tokenID: $mexID)
        totalLockedValueUSDFarms
        totalValueLockedUSD
        farms {
          address
          farmingToken {
            name
            identifier
            decimals
            __typename
          }
          farmTokenPriceUSD
          farmedTokenPriceUSD
          farmingTokenPriceUSD
          farmingTokenReserve
          perBlockRewards
          penaltyPercent
          totalValueLockedUSD
          __typename
        }

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
          info {
            reserves0
            reserves1
            totalSupply
            __typename
          }
          state
          type
          lockedValueUSD
          volumeUSD24h
          __typename
        }
        factory {
          totalVolumeUSD24h
          __typename
        }
      }
    `;

    const result: any = await this.graphQlService.getData(query, variables);
    if (!result) {
      return [];
    }

    return result.pairs.map((pair: any) => this.getPairInfo(pair)).filter((x: MexPair) => x.state === MexPairState.active);
  }

  private getPairInfo(pair: any): MexPair {
    const firstTokenSymbol = pair.firstToken.identifier.split('-')[0];
    const secondTokenSymbol = pair.secondToken.identifier.split('-')[0];

    if ((firstTokenSymbol === 'WEGLD' && secondTokenSymbol === 'USDC') || secondTokenSymbol === 'WEGLD') {
      return {
        address: pair.address,
        baseId: pair.firstToken.identifier,
        basePrice: Number(pair.firstTokenPriceUSD),
        baseSymbol: firstTokenSymbol,
        baseName: pair.firstToken.name,
        quoteId: pair.secondToken.identifier,
        quotePrice: Number(pair.secondTokenPriceUSD),
        quoteSymbol: secondTokenSymbol,
        quoteName: pair.secondToken.name,
        totalValue: Number(pair.lockedValueUSD),
        volume24h: Number(pair.volumeUSD24h),
        state: this.getPairState(pair.state),
        type: this.getPairType(pair.type),
      };
    }

    return {
      address: pair.address,
      baseId: pair.secondToken.identifier,
      basePrice: Number(pair.secondTokenPriceUSD),
      baseSymbol: secondTokenSymbol,
      baseName: pair.secondToken.name,
      quoteId: pair.firstToken.identifier,
      quotePrice: Number(pair.firstTokenPriceUSD),
      quoteSymbol: firstTokenSymbol,
      quoteName: pair.firstToken.name,
      totalValue: Number(pair.lockedValueUSD),
      volume24h: Number(pair.volumeUSD24h),
      state: this.getPairState(pair.state),
      type: this.getPairType(pair.type),
    };
  }

  private getPairState(state: string): MexPairState {
    switch (state) {
      case 'Active':
        return MexPairState.active;
      case 'Inactive':
        return MexPairState.inactive;
      case 'ActiveNoSwaps':
        return MexPairState.paused;
      default:
        throw new Error(`Unsupported pair state '${state}'`);
    }
  }

  private getPairType(type: string): MexPairType {
    switch (type) {
      case 'Core':
        return MexPairType.core;
      case 'Community':
        return MexPairType.community;
      case 'Ecosystem':
        return MexPairType.ecosystem;
      case 'Experimental':
        return MexPairType.experimental;
      default:
        throw new Error(`Unsupported pair type '${type}'`);
    }
  }
}
