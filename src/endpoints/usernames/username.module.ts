import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { UsernameController } from "./username.controller";
import { UsernameService } from "./username.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => VmQueryModule),
  ],
  controllers: [
    UsernameController,
  ],
  providers: [
    UsernameService
  ],
  exports: [
    UsernameService
  ]
})
export class UsernameModule { }