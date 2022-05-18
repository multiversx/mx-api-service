import { forwardRef, Module } from "@nestjs/common";
import { NodeModule } from "src/endpoints/nodes/node.module";
import { ProviderModule } from "src/endpoints/providers/provider.module";
import { GithubModule } from "../github/github.module";
import { KeybaseService } from "./keybase.service";

@Module({
  imports: [
    forwardRef(() => NodeModule),
    forwardRef(() => ProviderModule),
    forwardRef(() => GithubModule),
  ],
  providers: [
    KeybaseService,
  ],
  exports: [
    KeybaseService,
  ],
})
export class KeybaseModule { }
