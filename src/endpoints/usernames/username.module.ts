import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { UsernameService } from "./username.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => VmQueryModule),
  ],
  providers: [
    UsernameService,
  ],
  exports: [
    UsernameService,
  ],
})
export class UsernameModule { }