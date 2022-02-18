import { Module } from "@nestjs/common";
import { MiniBlockService } from "./mini.block.service";

@Module({
  providers: [
    MiniBlockService,
  ],
  exports: [
    MiniBlockService,
  ],
})
export class MiniBlockModule { }
