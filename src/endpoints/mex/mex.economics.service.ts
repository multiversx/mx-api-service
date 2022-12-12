import { CachingService } from "@elrondnetwork/erdnest";
import { BadRequestException, Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { CacheInfo } from "src/utils/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { MexSettingsService } from "./mex.settings.service";

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

  async getMexEconomics() {
    return await this.cachingService.getOrSetCache(
      CacheInfo.MexEconomics.key,
      async () => await this.getMexEconomicsRaw(),
      CacheInfo.MexEconomics.ttl,
    );
  }

  async getMexEconomicsRaw() {
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

    const result: any = await this.graphQlService.getData(query, variables);
    if (!result) {
      throw new BadRequestException('Could not fetch MEX economics data from MEX microservice');
    }

    const totalSupply = 8_045_920_000_000;
    const price = Number(result.mexPriceUSD);
    const circulatingSupply = Number(result.mexSupply);
    const marketCap = Math.round(circulatingSupply * price);
    const volume24h = Math.round(Number(result.factory.totalVolumeUSD24h));
    const marketPairs = settings.pairContracts.length;

    return {
      totalSupply,
      circulatingSupply,
      price,
      marketCap,
      volume24h,
      marketPairs,
    };
  }
}
