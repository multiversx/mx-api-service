import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "./api.config.module";
import { BlsModule } from "./bls.module";
import { CachingModule } from "./caching/caching.module";
import { EsdtModule } from "./esdt.module";
import { ExternalModule } from "./external-calls-services/external.module";
import { KeybaseModule } from "./key-validation/keybase.module";
import { ProfilerModule } from "./profiler.module";


@Module({
  imports: [
    forwardRef(() => ApiConfigModule), 
    forwardRef(() => CachingModule), 
    forwardRef(() => ExternalModule), 
    forwardRef(() => BlsModule), 
    forwardRef(() => EsdtModule), 
    forwardRef(() => ProfilerModule),
    forwardRef(() => KeybaseModule),
  ],
  exports: [
    ApiConfigModule, CachingModule, ExternalModule, BlsModule, EsdtModule, ProfilerModule,
    KeybaseModule,
  ]
})
export class CommonModule { }