import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { KeysService } from "./keys.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => VmQueryModule),
  ],
  providers: [
    KeysService,
  ],
  exports: [
    KeysService,
  ]
})
export class KeysModule { }