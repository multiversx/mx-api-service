import { Constants, CachingService } from "@elrondnetwork/nestjs-microservice-template";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { MexFarm } from "./entities/mex.farm";
import { MexFarmType } from "./entities/mex.farm.type";
import { MexTokenService } from "./mex.token.service";

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

  async getMexFarms(from: number, size: number): Promise<MexFarm[]> {
    const mexFarms = await this.getAllMexFarms();

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

    const pairs = await this.mexTokenService.getIndexedMexTokens();

    const farms = result.farms.map((farm: any) => {
      let price = Number(farm.farmTokenPriceUSD);

      const symbol = farm.farmToken.collection.split('-')[0];
      if (['EGLDUSDCF', 'EGLDUSDCFL'].includes(symbol)) {
        price = price / (10 ** 12) * 2;
      }

      const mexFarm = new MexFarm();
      mexFarm.type = MexFarmType.standard;
      mexFarm.address = farm.address;
      mexFarm.id = farm.farmToken.collection;
      mexFarm.symbol = symbol;
      mexFarm.name = farm.farmToken.name;
      mexFarm.price = price;
      mexFarm.farmingId = farm.farmingToken.identifier;
      mexFarm.farmingSymbol = farm.farmingToken.identifier.split('-')[0];
      mexFarm.farmingName = farm.farmingToken.name;
      mexFarm.farmingPrice = Number(farm.farmingTokenPriceUSD);
      mexFarm.farmedId = farm.farmedToken.identifier;
      mexFarm.farmedSymbol = farm.farmedToken.identifier.split('-')[0];
      mexFarm.farmedName = farm.farmedToken.name;
      mexFarm.farmedPrice = Number(farm.farmedTokenPriceUSD);

      return mexFarm;
    });

    const stakingFarms = result.stakingFarms.map((stakingFarm: any) => {
      const price = pairs[stakingFarm.farmingToken.identifier]?.price ?? 0;

      const mexFarm = new MexFarm();
      mexFarm.type = MexFarmType.metastaking;
      mexFarm.address = stakingFarm.address;
      mexFarm.id = stakingFarm.farmToken.collection;
      mexFarm.symbol = stakingFarm.farmToken.collection.split('-')[0];
      mexFarm.name = stakingFarm.farmToken.name;
      mexFarm.price = price;
      mexFarm.farmingId = stakingFarm.farmingToken.identifier;
      mexFarm.farmingSymbol = stakingFarm.farmingToken.identifier.split('-')[0];
      mexFarm.farmingName = stakingFarm.farmingToken.name;
      mexFarm.farmingPrice = price;
      mexFarm.farmedId = stakingFarm.farmingToken.identifier;
      mexFarm.farmedSymbol = stakingFarm.farmingToken.identifier.split('-')[0];
      mexFarm.farmedName = stakingFarm.farmingToken.name;
      mexFarm.farmedPrice = price;

      return mexFarm;
    });

    return [...farms, ...stakingFarms];
  }
}
