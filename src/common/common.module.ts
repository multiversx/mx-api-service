import { Module } from "@nestjs/common";
import { ApiConfigModule } from "./api.config.module";
import { BlsService } from "./bls.service";
import { CachingModule } from "./caching/caching.module";
import { EsdtService } from "./esdt.service";
import { ExternalModule } from "./external-calls-services/external.module";
import { ProfilerService } from "./profiler.service";


@Module({
  imports: [
    ApiConfigModule, CachingModule, ExternalModule
  ],
  providers: [
    BlsService, EsdtService, ProfilerService
  ],
  exports: [
    BlsService, EsdtService, ProfilerService
  ]
})
export class CommonModule { }