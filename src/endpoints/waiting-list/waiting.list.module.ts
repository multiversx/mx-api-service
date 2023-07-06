import { Module } from "@nestjs/common";
import { WaitingListService } from "./waiting.list.service";
import { DelegationContractModule } from "../vm.query/contracts/delegation.contract.module";

@Module({
  imports: [
    DelegationContractModule,
  ],
  providers: [
    WaitingListService,
  ],
  exports: [
    WaitingListService,
  ],
})
export class WaitingListModule { }
