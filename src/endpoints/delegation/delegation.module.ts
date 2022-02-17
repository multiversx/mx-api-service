import { forwardRef, Module } from "@nestjs/common";
import { NodeModule } from "../nodes/node.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { DelegationService } from "./delegation.service";

@Module({
  imports: [
    forwardRef(() => VmQueryModule),
    forwardRef(() => NodeModule),
  ],
  providers: [
    DelegationService,
  ],
  exports: [
    DelegationService,
  ],
})
export class DelegationModule { }
