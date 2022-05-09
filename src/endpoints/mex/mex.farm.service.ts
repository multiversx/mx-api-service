import { Injectable } from "@nestjs/common";
import BigNumber from "bignumber.js";
import { gql } from "graphql-request";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { MexFarm } from "./entities/mex.farm";
import { MexToken } from "./entities/mex.token";
import { MexTokenService } from "./mex.token.service";

@Injectable()
export class MexFarmService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly graphQlService: GraphQlService,
    private readonly mexTokenService: MexTokenService
  ) { }

  async refreshMexFarms(): Promise<void> {
    const farms = await this.getAllMexFarmsRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexFarms.key, farms, CacheInfo.MexFarms.ttl);
  }

  async getMexFarms(from: number, size: number): Promise<MexFarm[]> {
    const mexFarms = await this.cachingService.getOrSetCache(
      CacheInfo.MexFarms.key,
      async () => await this.getAllMexFarmsRaw(),
      CacheInfo.MexFarms.ttl
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

    const mexTokens = await this.mexTokenService.getIndexedMexTokens();

    const farms = result.farms.map((farm: any) => {
      const mexFarm = new MexFarm();
      mexFarm.address = farm.address;

      const farmingToken = new MexToken();
      farmingToken.symbol = farm.farmingToken.identifier;
      farmingToken.name = farm.farmingToken.name;
      farmingToken.price = new BigNumber(farm.farmTokenPriceUSD).toNumber();

      const farmedToken = new MexToken();
      farmedToken.symbol = farm.farmedToken.identifier;
      farmedToken.name = farm.farmedToken.name;
      farmedToken.price = new BigNumber(farm.farmedTokenPriceUSD).toNumber();

      mexFarm.farmingToken = farmingToken;
      mexFarm.farmedToken = farmedToken;

      return mexFarm;
    });

    const stakingFarms = result.stakingFarms.map((stakingFarm: any) => {
      const mexFarm = new MexFarm();
      mexFarm.address = stakingFarm.address;

      const farmingToken = new MexToken();
      farmingToken.symbol = stakingFarm.farmToken.collection;
      farmingToken.name = stakingFarm.farmToken.name;

      const farmedToken = new MexToken();
      farmedToken.symbol = stakingFarm.farmingToken.identifier;
      farmedToken.name = stakingFarm.farmingToken.name;

      const mexToken = mexTokens[farmedToken.symbol] ?? mexTokens[farmingToken.symbol];

      farmingToken.price = mexToken.price;
      farmedToken.price = mexToken.price;

      mexFarm.farmingToken = farmingToken;
      mexFarm.farmedToken = farmedToken;

      return mexFarm;
    });

    return [...farms, ...stakingFarms];
  }
}
