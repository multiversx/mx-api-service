import { CacheModuleOptions, CacheOptionsFactory, Inject, Injectable } from "@nestjs/common";
import { GENESIS_TIMESTAMP_SERVICE, IGenesisTimestamp } from "../genesis.timestamp";

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  constructor(
    @Inject(GENESIS_TIMESTAMP_SERVICE)
    private readonly genesisTimestampService: IGenesisTimestamp
  ) {}

  async createCacheOptions(): Promise<CacheModuleOptions> {
    let ttl = await this.genesisTimestampService.getSecondsRemainingUntilNextRound();
    
    return {
      ttl,
    };
  }
}