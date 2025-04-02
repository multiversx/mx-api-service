import { Constants } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { CacheInfo } from "src/utils/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { MexFarm } from "./entities/mex.farm";
import { MexTokenService } from "./mex.token.service";
import { MexStakingProxy } from "./entities/mex.staking.proxy";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { farmsQuery } from "./graphql/farms.query";
import { stakingProxyQuery } from "./graphql/staking.proxy.query";

@Injectable()
export class MexFarmService {
  constructor(
    private readonly cachingService: CacheService,
    private readonly graphQlService: GraphQlService,
    @Inject(forwardRef(() => MexTokenService))
    private readonly mexTokenService: MexTokenService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  async refreshMexFarms(): Promise<void> {
    const farms = await this.getAllMexFarmsRaw();
    await this.cachingService.setRemote(CacheInfo.MexFarms.key, farms, CacheInfo.MexFarms.ttl);
    this.cachingService.setLocal(CacheInfo.MexFarms.key, farms, Constants.oneSecond() * 30);
  }

  async getMexFarms(pagination: QueryPagination): Promise<MexFarm[]> {
    const mexFarms = await this.getAllMexFarms();
    const { from, size } = pagination;

    return mexFarms.slice(from, from + size);
  }

  async getAllMexFarms(): Promise<MexFarm[]> {
    if (!this.apiConfigService.isExchangeEnabled()) {
      return [];
    }

    return await this.cachingService.getOrSet(
      CacheInfo.MexFarms.key,
      async () => await this.getAllMexFarmsRaw(),
      CacheInfo.MexFarms.ttl,
      Constants.oneSecond() * 30,
    );
  }

  async getMexFarmsCount(): Promise<number> {
    const mexFarms = await this.getAllMexFarms();

    return mexFarms.length;
  }

  private async getAllMexFarmsRaw(): Promise<MexFarm[]> {
    const response: any = await this.graphQlService.getExchangeServiceData(farmsQuery, {});
    if (!response) {
      return [];
    }

    const pairs = await this.mexTokenService.getIndexedMexTokens();

    const farms = response.farms.map((farmResponse: any) => MexFarm.fromFarmQueryResponse(farmResponse));

    const stakingFarms = response.stakingFarms.map((stakingFarm: any) => MexFarm.fromStakingFarmResponse(stakingFarm, pairs));

    return [...farms, ...stakingFarms];
  }

  async getAllStakingProxies(): Promise<MexStakingProxy[]> {
    if (!this.apiConfigService.isExchangeEnabled()) {
      return [];
    }

    return await this.cachingService.getOrSet(
      CacheInfo.StakingProxies.key,
      async () => await this.getAllStakingProxiesRaw(),
      CacheInfo.StakingProxies.ttl,
      Constants.oneSecond() * 30,
    );
  }

  private async getAllStakingProxiesRaw(): Promise<MexStakingProxy[]> {
    const response: any = await this.graphQlService.getExchangeServiceData(stakingProxyQuery, {});
    if (!response) {
      return [];
    }

    const stakingProxies = response.stakingProxies.map((stakingProxyRaw: any) => MexStakingProxy.fromQueryResponse(stakingProxyRaw));
    return stakingProxies;
  }
}
