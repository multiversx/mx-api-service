import { forwardRef, Module } from "@nestjs/common";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { WaitingListService } from "./waiting.list.service";

@Module({
  imports: [
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
