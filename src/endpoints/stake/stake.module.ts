import { forwardRef, Module } from "@nestjs/common";
import { NetworkModule } from "../network/network.module";
import { NodeModule } from "../nodes/node.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { StakeService } from "./stake.service";

@Module({
  imports: [
    VmQueryModule,
    forwardRef(() => NodeModule),
    forwardRef(() => NetworkModule),
  ],
  providers: [
    StakeService,
  ],
  exports: [
    StakeService,
  ],
})
export class StakeModule { }
