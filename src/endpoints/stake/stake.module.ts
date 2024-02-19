import { forwardRef, Module } from "@nestjs/common";
import { NetworkModule } from "../network/network.module";
import { NodeModule } from "../nodes/node.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { StakeService } from "./stake.service";
import { IdentitiesModule } from "../identities/identities.module";
import { BlockModule } from "../blocks/block.module";

@Module({
  imports: [
    VmQueryModule,
    forwardRef(() => NodeModule),
    forwardRef(() => NetworkModule),
    forwardRef(() => IdentitiesModule),
    forwardRef(() => BlockModule),
  ],
  providers: [
    StakeService,
  ],
  exports: [
    StakeService,
  ],
})
export class StakeModule { }
