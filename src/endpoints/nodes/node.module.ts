import { forwardRef, Module } from "@nestjs/common";
import { KeybaseModule } from "src/common/keybase/keybase.module";
import { BlockModule } from "../blocks/block.module";
import { ProviderModule } from "../providers/provider.module";
import { StakeModule } from "../stake/stake.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { NodeService } from "./node.service";
import { KeysModule } from "../keys/keys.module";
import { IdentitiesModule } from "../identities/identities.module";

@Module({
  imports: [
    forwardRef(() => KeybaseModule),
    forwardRef(() => ProviderModule),
    VmQueryModule,
    forwardRef(() => BlockModule),
    forwardRef(() => StakeModule),
    forwardRef(() => KeysModule),
    forwardRef(() => IdentitiesModule),
  ],
  providers: [
    NodeService,
  ],
  exports: [
    NodeService,
  ],
})
export class NodeModule { }
