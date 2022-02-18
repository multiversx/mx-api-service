import { Module } from "@nestjs/common";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { UsernameService } from "./username.service";

@Module({
  imports: [
    VmQueryModule,
  ],
  providers: [
    UsernameService,
  ],
  exports: [
    UsernameService,
  ],
})
export class UsernameModule { }
