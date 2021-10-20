import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "./api.config.module";
import { BlsModule } from "./bls.module";
import { CachingModule } from "./caching/caching.module";
import { EsdtModule } from "./esdt.module";
import { ExternalModule } from "./external/external.module";
import { KeybaseModule } from "./key-validation/keybase.module";
import { MetricsModule } from "./metrics/metrics.module";

@Module({
  imports: [
    forwardRef(() => ApiConfigModule), 
    forwardRef(() => CachingModule), 
    forwardRef(() => ExternalModule), 
    forwardRef(() => BlsModule), 
    forwardRef(() => EsdtModule), 
    forwardRef(() => KeybaseModule),
    forwardRef(() => MetricsModule),
  ],
  exports: [
    ApiConfigModule, CachingModule, ExternalModule, BlsModule, EsdtModule,
    KeybaseModule, MetricsModule
  ]
})
export class CommonModule { }