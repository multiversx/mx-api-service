import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { BlockModule } from "../blocks/block.module";
import { ProviderModule } from "../providers/provider.module";
import { StakeModule } from "../stake/stake.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { NodeController } from "./node.controller";
import { NodeService } from "./node.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => ProviderModule),
    forwardRef(() => VmQueryModule),
    forwardRef(() => BlockModule),
    forwardRef(() => StakeModule),
  ],
  controllers: [
    NodeController,
  ],
  providers: [
    NodeService,
  ],
  exports: [
    NodeService,
  ]
})
export class NodeModule { }