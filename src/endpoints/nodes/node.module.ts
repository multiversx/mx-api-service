import { forwardRef, Module } from "@nestjs/common";
import { KeybaseModule } from "src/common/keybase/keybase.module";
import { BlockModule } from "../blocks/block.module";
import { ProviderModule } from "../providers/provider.module";
import { StakeModule } from "../stake/stake.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { NodeService } from "./node.service";

@Module({
  imports: [
    forwardRef(() => KeybaseModule),
    forwardRef(() => ProviderModule),
    VmQueryModule,
    forwardRef(() => BlockModule),
    forwardRef(() => StakeModule),
  ],
  providers: [
    NodeService,
  ],
  exports: [
    NodeService,
  ],
})
export class NodeModule { }
