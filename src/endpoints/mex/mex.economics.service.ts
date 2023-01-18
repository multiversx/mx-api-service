import { CachingService } from "@elrondnetwork/erdnest";
import { BadRequestException, Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { CacheInfo } from "src/utils/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { MexSettingsService } from "./mex.settings.service";
import { MexEconomics } from "./entities/mex.economics";

@Injectable()
export class MexEconomicsService {
  constructor(
    private readonly mexSettingService: MexSettingsService,
    private readonly cachingService: CachingService,
    private readonly graphQlService: GraphQlService
  ) { }

  async refreshMexEconomics() {
    const economics = await this.getMexEconomicsRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexEconomics.key, economics, CacheInfo.MexEconomics.ttl);
  }

  async getMexEconomics(): Promise<MexEconomics> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.MexEconomics.key,
      async () => await this.getMexEconomicsRaw(),
      CacheInfo.MexEconomics.ttl,
    );
  }

  async getMexEconomicsRaw(): Promise<MexEconomics> {
    const settings = await this.mexSettingService.getSettings();
    if (!settings) {
      throw new BadRequestException('Could not fetch MEX settings');
    }

    const variables = {
      "mexID": settings.mexId,
      "days": 7,
    };

    const query = gql`
      query ($days: Int!, $mexID: String!) {
        totalAggregatedRewards(days: $days)
        mexPriceUSD: getTokenPriceUSD(tokenID: $mexID)
        mexSupply: totalTokenSupply(tokenID: $mexID)
        factory {
          totalVolumeUSD24h
          __typename
        }
      }
    `;

    const response: any = await this.graphQlService.getData(query, variables);
    if (!response) {
      throw new BadRequestException('Could not fetch MEX economics data from MEX microservice');
    }

    const mexEconomics = MexEconomics.fromQueryResponse(response, settings);
    return mexEconomics;
  }
}
