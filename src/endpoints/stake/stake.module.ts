import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { NetworkModule } from "../network/network.module";
import { NodeModule } from "../nodes/node.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { StakeController } from "./stake.controller";
import { StakeService } from "./stake.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => VmQueryModule),
    forwardRef(() => NodeModule),
    forwardRef(() => NetworkModule),
  ],
  controllers: [
    StakeController,
  ],
  providers: [
    StakeService,
  ],
  exports: [
    StakeService
  ]
})
export class StakeModule { }