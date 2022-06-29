import { BadRequestException, Injectable, Logger } from "@nestjs/common";
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
export class MexPairService {
  private readonly logger: Logger;

  constructor(
    private readonly cachingService: CachingService,
    private readonly mexSettingService: MexSettingsService,
    private readonly graphQlService: GraphQlService,
  ) {
    this.logger = new Logger(MexPairService.name);
  }

  async refreshMexPairs(): Promise<void> {
    const pairs = await this.getAllMexPairsRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexPairs.key, pairs, CacheInfo.MexPairs.ttl);
    await this.cachingService.setCacheLocal(CacheInfo.MexPairs.key, pairs, Constants.oneSecond() * 30);
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
    try {
      const settings = await this.mexSettingService.getSettings();
      if (!settings) {
        throw new BadRequestException('Could not fetch MEX settings');
      }

      const variables = {
        "offset": 0,
        "pairsLimit": 100,
      };

      const query = gql`
        query ($offset: Int, $pairsLimit: Int) {
          pairs(offset: $offset, limit: $pairsLimit) { 
            address 
            liquidityPoolToken {
              identifier
              name
              __typename
            }
            liquidityPoolTokenPriceUSD
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
        }
      `;

      const result: any = await this.graphQlService.getData(query, variables);
      if (!result) {
        return [];
      }

      return result.pairs.map((pair: any) => this.getPairInfo(pair)).filter((x: MexPair | undefined) => x && x.state === MexPairState.active);
    } catch (error) {
      this.logger.error('An error occurred while getting all mex pairs');
      this.logger.error(error);
      return [];
    }
  }

  private getPairInfo(pair: any): MexPair | undefined {
    const firstTokenSymbol = pair.firstToken.identifier.split('-')[0];
    const secondTokenSymbol = pair.secondToken.identifier.split('-')[0];
    const state = this.getPairState(pair.state);
    const type = this.getPairType(pair.type);
    if (!type || type === MexPairType.jungle) {
      return undefined;
    }

    if ((firstTokenSymbol === 'WEGLD' && secondTokenSymbol === 'USDC') || secondTokenSymbol === 'WEGLD') {
      return {
        address: pair.address,
        id: pair.liquidityPoolToken.identifier,
        symbol: pair.liquidityPoolToken.identifier.split('-')[0],
        name: pair.liquidityPoolToken.name,
        price: Number(pair.liquidityPoolTokenPriceUSD),
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
        state,
        type,
      };
    }

    return {
      address: pair.address,
      id: pair.liquidityPoolToken.identifier,
      symbol: pair.liquidityPoolToken.identifier.split('-')[0],
      name: pair.liquidityPoolToken.name,
      price: Number(pair.liquidityPoolTokenPriceUSD),
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
      state,
      type,
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

  private getPairType(type: string): MexPairType | undefined {
    switch (type) {
      case 'Core':
        return MexPairType.core;
      case 'Community':
        return MexPairType.community;
      case 'Ecosystem':
        return MexPairType.ecosystem;
      case 'Experimental':
        return MexPairType.experimental;
      case 'Jungle':
        return MexPairType.jungle;
      default:
        this.logger.error(`Unsupported pair type '${type}'`);
        return undefined;
    }
  }
}
