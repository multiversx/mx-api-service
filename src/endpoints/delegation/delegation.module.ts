import { Module } from "@nestjs/common";
import { NodeModule } from "../nodes/node.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { DelegationService } from "./delegation.service";
import { DelegationManagerContractModule } from "../vm.query/contracts/delegation.manager.contract.module";

@Module({
  imports: [
    VmQueryModule,
    NodeModule,
    DelegationManagerContractModule,
  ],
  providers: [
    DelegationService,
  ],
  exports: [
    DelegationService,
  ],
})
export class DelegationModule { }
