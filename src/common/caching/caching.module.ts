import { CacheModule, forwardRef, Module } from "@nestjs/common";
import { RoundModule } from "src/endpoints/rounds/round.module";
import { MicroserviceModule } from "src/microservice.module";
import { ApiConfigModule } from "../api.config.module";
import { CacheConfigService } from "./cache.config.service";
import { CachingService } from "./caching.service";

@Module({
  imports: [
    CacheModule.register(),
    ApiConfigModule,
    forwardRef(() => RoundModule),
    forwardRef(() => MicroserviceModule),
  ],
  providers: [
    CachingService, CacheConfigService,
  ],
  exports: [
    CachingService, CacheConfigService,
  ]
})
export class CachingModule { }