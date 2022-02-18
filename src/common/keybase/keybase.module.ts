import { forwardRef, Module } from "@nestjs/common";
import { NodeModule } from "src/endpoints/nodes/node.module";
import { ProviderModule } from "src/endpoints/providers/provider.module";
import { ApiConfigModule } from "../api-config/api.config.module";
import { CachingModule } from "../caching/caching.module";
import { ApiModule } from "../network/api.module";
import { KeybaseService } from "./keybase.service";


@Module({
  imports: [
    ApiConfigModule,
    CachingModule,
    ApiModule,
    forwardRef(() => NodeModule),
    ProviderModule,
  ],
  providers: [
    KeybaseService,
  ],
  exports: [
    KeybaseService,
  ],
})
export class KeybaseModule { }
