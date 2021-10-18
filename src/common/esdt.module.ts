import { Module } from "@nestjs/common";
import { ApiConfigModule } from "./api.config.module";
import { CachingModule } from "./caching/caching.module";
import { EsdtService } from "./esdt.service";
import { ExternalModule } from "./external-calls-services/external.module";


@Module({
  imports: [
    ApiConfigModule, ExternalModule, CachingModule,
  ],
  providers: [
    EsdtService
  ],
  exports: [
    EsdtService
  ]
})
export class EsdtModule { }