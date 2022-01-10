import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { SmartContractResultService } from "./scresult.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  providers: [
    SmartContractResultService,
  ],
  exports: [
    SmartContractResultService,
  ],
})
export class SmartContractResultModule { }