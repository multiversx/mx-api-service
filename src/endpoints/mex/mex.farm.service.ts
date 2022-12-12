import { Constants, CachingService } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { QueryPagination } from "src/common/entities/query.pagination";
import { CacheInfo } from "src/utils/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { MexFarm } from "./entities/mex.farm";
import { MexTokenService } from "./mex.token.service";
import { MexStakingProxy } from "./entities/mex.staking.proxy";

@Injectable()
export class MexFarmService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly graphQlService: GraphQlService,
    @Inject(forwardRef(() => MexTokenService))
    private readonly mexTokenService: MexTokenService,
  ) { }

  async refreshMexFarms(): Promise<void> {
    const farms = await this.getAllMexFarmsRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexFarms.key, farms, CacheInfo.MexFarms.ttl);
    await this.cachingService.setCacheLocal(CacheInfo.MexFarms.key, farms, Constants.oneSecond() * 30);
  }

  async getMexFarms(pagination: QueryPagination): Promise<MexFarm[]> {
    const mexFarms = await this.getAllMexFarms();
    const { from, size } = pagination;

    return mexFarms.slice(from, from + size);
  }

  async getAllMexFarms(): Promise<MexFarm[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.MexFarms.key,
      async () => await this.getAllMexFarmsRaw(),
      CacheInfo.MexFarms.ttl,
      Constants.oneSecond() * 30,
    );
  }

  private async getAllMexFarmsRaw(): Promise<MexFarm[]> {
    const query = gql`
      query {
        farms {
          ... on FarmModelV1_2 {
            address
            farmToken {
              collection
              name
              ticker
              __typename
            }
            farmingToken {
              name
              identifier
              decimals
              __typename
            }
            farmedToken {
              name
              identifier
              decimals
              __typename
            }
            farmTokenPriceUSD
            farmingTokenPriceUSD
            farmedTokenPriceUSD
          }
          ... on FarmModelV1_3 {
            address
            farmToken {
              collection
              name
              ticker
              __typename
            }
            farmingToken {
              name
              identifier
              decimals
              __typename
            }
            farmedToken {
              name
              identifier
              decimals
              __typename
            }
            farmTokenPriceUSD
            farmingTokenPriceUSD
            farmedTokenPriceUSD
          }
          ... on FarmModelV2 {
            address
            farmToken {
              collection
              name
              ticker
              __typename
            }
            farmingToken {
              name
              identifier
              decimals
              __typename
            }
            farmedToken {
              name
              identifier
              decimals
              __typename
            }
            farmTokenPriceUSD
            farmingTokenPriceUSD
            farmedTokenPriceUSD
          }
        }
        stakingFarms {
          address
          farmingToken {
            name
            identifier
            decimals
              __typename
          }
          farmToken {
            name
            collection
            decimals
              __typename
          }
        }
      }
    `;

    const response: any = await this.graphQlService.getData(query, {});
    if (!response) {
      return [];
    }

    const pairs = await this.mexTokenService.getIndexedMexTokens();

    const farms = response.farms.map((farmResponse: any) => MexFarm.fromFarmQueryResponse(farmResponse));

    const stakingFarms = response.stakingFarms.map((stakingFarm: any) => MexFarm.fromStakingFarmResponse(stakingFarm, pairs));

    return [...farms, ...stakingFarms];
  }

  async getAllStakingProxies(): Promise<MexStakingProxy[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.StakingProxies.key,
      async () => await this.getAllStakingProxiesRaw(),
      CacheInfo.StakingProxies.ttl,
      Constants.oneSecond() * 30,
    );
  }

  private async getAllStakingProxiesRaw(): Promise<MexStakingProxy[]> {
    const query = gql`
      query StakingProxy {
        stakingProxies {
          address
          dualYieldToken {
            name
            collection
          }
        }
      }`;

    const response: any = await this.graphQlService.getData(query, {});
    if (!response) {
      return [];
    }

    const stakingProxies = response.stakingProxies.map((stakingProxyRaw: any) => MexStakingProxy.fromQueryResponse(stakingProxyRaw));
    return stakingProxies;
  }
}
