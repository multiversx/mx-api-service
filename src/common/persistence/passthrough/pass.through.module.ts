import { Module } from "@nestjs/common";
import { PassThroughService } from "./pass.through.service";

@Module({
  providers: [PassThroughService],
  exports: [PassThroughService]
})
export class PassThroughModule { }