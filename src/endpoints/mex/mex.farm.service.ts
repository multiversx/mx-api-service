import { Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { Constants } from "src/utils/constants";
import { MexFarm } from "./entities/mex.farm";

@Injectable()
export class MexFarmService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly graphQlService: GraphQlService,
  ) { }

  async refreshMexFarms(): Promise<void> {
    const farms = await this.getAllMexFarmsRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexFarms.key, farms, CacheInfo.MexFarms.ttl);
  }

  async getMexFarms(from: number, size: number): Promise<MexFarm[]> {
    const mexFarms = await this.cachingService.getOrSetCache(
      CacheInfo.MexFarms.key,
      async () => await this.getAllMexFarmsRaw(),
      CacheInfo.MexFarms.ttl,
      Constants.oneSecond() * 30,
    );

    return mexFarms.slice(from, from + size);
  }

  private async getAllMexFarmsRaw(): Promise<MexFarm[]> {
    const query = gql`
      query {
        farms {
          address
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
          farmedTokenPriceUSD
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

    const result: any = await this.graphQlService.getData(query, {});
    if (!result) {
      return [];
    }

    const farms = result.farms.map((farm: any) => {
      const mexFarm = new MexFarm();
      mexFarm.address = farm.address;
      mexFarm.farmingToken = farm.farmingToken.identifier;
      mexFarm.farmedToken = farm.farmedToken.identifier;

      return mexFarm;
    });

    const stakingFarms = result.stakingFarms.map((stakingFarm: any) => {
      const mexFarm = new MexFarm();
      mexFarm.address = stakingFarm.address;
      mexFarm.farmingToken = stakingFarm.farmToken.collection;
      mexFarm.farmedToken = stakingFarm.farmingToken.identifier;

      return mexFarm;
    });

    return [...farms, ...stakingFarms];
  }
}
