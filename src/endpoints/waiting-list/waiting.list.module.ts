import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { WaitingListService } from "./waiting.list.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => VmQueryModule),
  ],
  providers: [
    WaitingListService,
  ],
  exports: [
    WaitingListService,
  ],
})
export class WaitingListModule { }
