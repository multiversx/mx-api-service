import { CacheModule, forwardRef, Module } from "@nestjs/common";
import { RoundModule } from "src/endpoints/rounds/round.module";
import { PubSubModule } from "src/pub.sub.module";
import { ApiConfigModule } from "../api.config.module";
import { CacheConfigService } from "./cache.config.service";
import { CachingService } from "./caching.service";

@Module({
  imports: [
    CacheModule.register(),
    ApiConfigModule,
    forwardRef(() => RoundModule),
    forwardRef(() => PubSubModule),
  ],
  providers: [
    CachingService, CacheConfigService,
  ],
  exports: [
    CachingService, CacheConfigService,
  ]
})
export class CachingModule { }