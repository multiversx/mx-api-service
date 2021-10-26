import { CacheModuleOptions, CacheOptionsFactory, Inject, Injectable } from "@nestjs/common";
import { GENESIS_TIMESTAMP_SERVICE, GenesisTimestampInterface } from "../../utils/genesis.timestamp.interface";

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  constructor(
    @Inject(GENESIS_TIMESTAMP_SERVICE)
    private readonly genesisTimestampService: GenesisTimestampInterface
  ) {}

  async createCacheOptions(): Promise<CacheModuleOptions> {
    let ttl = await this.genesisTimestampService.getSecondsRemainingUntilNextRound();
    
    return {
      ttl,
    };
  }
}