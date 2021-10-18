import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { KeysController } from "./keys.controller";
import { KeysService } from "./keys.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => VmQueryModule),
  ],
  controllers: [
    KeysController,
  ],
  providers: [
    KeysService,
  ],
  exports: [
    KeysService,
  ]
})
export class KeysModule { }