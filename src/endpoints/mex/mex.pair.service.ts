import { Constants } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { BadRequestException, Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { CacheInfo } from "src/utils/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { MexPair } from "./entities/mex.pair";
import { MexPairState } from "./entities/mex.pair.state";
import { MexPairType } from "./entities/mex.pair.type";
import { MexSettingsService } from "./mex.settings.service";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { MexPairExchange } from "./entities/mex.pair.exchange";
import { MexPairsFilter } from "./entities/mex.pairs..filter";

@Injectable()
export class MexPairService {
  private readonly logger = new OriginLogger(MexPairService.name);

  constructor(
    private readonly cachingService: CacheService,
    private readonly mexSettingService: MexSettingsService,
    private readonly graphQlService: GraphQlService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  async refreshMexPairs(): Promise<void> {
    const pairs = await this.getAllMexPairsRaw();
    await this.cachingService.setRemote(CacheInfo.MexPairs.key, pairs, CacheInfo.MexPairs.ttl);
    await this.cachingService.setLocal(CacheInfo.MexPairs.key, pairs, Constants.oneSecond() * 30);
  }

  async getMexPairs(from: number, size: number, filter?: MexPairsFilter): Promise<any> {
    let allMexPairs = await this.getAllMexPairs();
    allMexPairs = this.applyFilters(allMexPairs, filter);

    return allMexPairs.slice(from, from + size);
  }


  async getMexPair(baseId: string, quoteId: string): Promise<MexPair | undefined> {
    const allMexPairs = await this.getAllMexPairs();
    return allMexPairs.find(pair => pair.baseId === baseId && pair.quoteId === quoteId);
  }

  async getAllMexPairs(): Promise<MexPair[]> {
    if (!this.apiConfigService.isExchangeEnabled()) {
      return [];
    }

    return await this.cachingService.getOrSet(
      CacheInfo.MexPairs.key,
      async () => await this.getAllMexPairsRaw(),
      CacheInfo.MexPairs.ttl,
      Constants.oneSecond() * 30
    );
  }

  async getMexPairsCount(filter?: MexPairsFilter): Promise<number> {
    const mexPairs = await this.getAllMexPairs();
    const filteredPairs = this.applyFilters(mexPairs, filter);

    return filteredPairs.length;
  }

  async getAllMexPairsRaw(): Promise<MexPair[]> {
    try {
      const settings = await this.mexSettingService.getSettings();
      if (!settings) {
        throw new BadRequestException('Could not fetch MEX settings');
      }

      const pairsLimit = gql`
      query PairCount {
        factory {
          pairCount
        }
      }`;

      const pairsLimitResult: any = await this.graphQlService.getExchangeServiceData(pairsLimit);
      const totalPairs = pairsLimitResult?.factory?.pairCount;

      const variables = {
        "offset": 0,
        "pairsLimit": totalPairs,
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
              previous24hPrice
              __typename
            }
            secondToken {
              name
              identifier
              decimals
              previous24hPrice
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

      const result: any = await this.graphQlService.getExchangeServiceData(query, variables);
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

    if (!type || [MexPairType.unlisted].includes(type)) {
      return undefined;
    }

    const xexchangeTypes = [
      MexPairType.core,
      MexPairType.community,
      MexPairType.experimental,
      MexPairType.ecosystem,
    ];

    let exchange: MexPairExchange;

    if (xexchangeTypes.includes(type)) {
      exchange = MexPairExchange.xexchange;
    } else {
      exchange = MexPairExchange.unknown;
    }

    if ((firstTokenSymbol === 'WEGLD' && secondTokenSymbol === 'USDC') || secondTokenSymbol === 'WEGLD') {
      return {
        address: pair.address,
        id: pair.liquidityPoolToken.identifier,
        symbol: pair.liquidityPoolToken.identifier.split('-')[0],
        name: pair.liquidityPoolToken.name,
        price: Number(pair.liquidityPoolTokenPriceUSD),
        basePrevious24hPrice: Number(pair.firstToken.previous24hPrice),
        quotePrevious24hPrice: Number(pair.secondToken.previous24hPrice),
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
        exchange,
      };
    }

    return {
      address: pair.address,
      id: pair.liquidityPoolToken.identifier,
      symbol: pair.liquidityPoolToken.identifier.split('-')[0],
      name: pair.liquidityPoolToken.name,
      price: Number(pair.liquidityPoolTokenPriceUSD),
      basePrevious24hPrice: Number(pair.secondToken.previous24hPrice),
      quotePrevious24hPrice: Number(pair.firstToken.previous24hPrice),
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
      exchange,
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
      case 'PartialActive':
        return MexPairState.partial;
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
      case 'Unlisted':
        return MexPairType.unlisted;
      default:
        this.logger.error(`Unsupported pair type '${type}'`);
        return undefined;
    }
  }

  private applyFilters(mexPairs: MexPair[], filter?: MexPairsFilter): MexPair[] {
    if (!filter) {
      return mexPairs;
    }

    let filteredPairs = mexPairs;

    if (filter.exchange) {
      filteredPairs = filteredPairs.filter(pair => pair.exchange === filter.exchange);
    }

    return filteredPairs;
  }
}
