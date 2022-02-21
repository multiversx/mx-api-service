import { Module } from "@nestjs/common";
import { SmartContractResultService } from "./scresult.service";

@Module({
  providers: [
    SmartContractResultService,
  ],
  exports: [
    SmartContractResultService,
  ],
})
export class SmartContractResultModule { }
