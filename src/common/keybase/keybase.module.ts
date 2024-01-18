import { forwardRef, Module } from "@nestjs/common";
import { NodeModule } from "src/endpoints/nodes/node.module";
import { ProviderModule } from "src/endpoints/providers/provider.module";
import { ApiConfigModule } from "../api-config/api.config.module";
import { GithubModule } from "../github/github.module";
import { PersistenceModule } from "../persistence/persistence.module";
import { KeybaseService } from "./keybase.service";
import { AssetsModule } from "../assets/assets.module";

@Module({
  imports: [
    forwardRef(() => NodeModule),
    forwardRef(() => ProviderModule),
    forwardRef(() => GithubModule),
    ApiConfigModule,
    PersistenceModule.forRoot(),
    AssetsModule,
  ],
  providers: [
    KeybaseService,
  ],
  exports: [
    KeybaseService,
  ],
})
export class KeybaseModule { }
