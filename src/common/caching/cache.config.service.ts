import { CacheModuleOptions, CacheOptionsFactory, Injectable } from "@nestjs/common";
import { ProtocolService } from "../protocol/protocol.service";

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  constructor(
    private readonly protocolService: ProtocolService,
  ) { }

  async createCacheOptions(): Promise<CacheModuleOptions> {
    const ttl = await this.protocolService.getSecondsRemainingUntilNextRound();

    return {
      ttl,
    };
  }
}
