import { forwardRef, Module } from "@nestjs/common";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { KeysService } from "./keys.service";

@Module({
  imports: [
    forwardRef(() => VmQueryModule),
  ],
  providers: [
    KeysService,
  ],
  exports: [
    KeysService,
  ],
})
export class KeysModule { }
