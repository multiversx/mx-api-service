import { forwardRef, Module } from "@nestjs/common";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { UsernameService } from "./username.service";

@Module({
  imports: [
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
