import { forwardRef, Module } from "@nestjs/common";
import { MetricsModule } from "src/common/metrics/metrics.module";
import { VmQueryModule } from "src/endpoints/vm.query/vm.query.module";
import { ApiConfigModule } from "./api.config.module";
import { CachingModule } from "./caching/caching.module";
import { EsdtService } from "./esdt.service";
import { ExternalModule } from "./external-calls-services/external.module";


@Module({
  imports: [
    ApiConfigModule, ExternalModule, CachingModule,
    forwardRef(() => VmQueryModule),
    forwardRef(() => MetricsModule),
  ],
  providers: [
    EsdtService
  ],
  exports: [
    EsdtService
  ]
})
export class EsdtModule { }