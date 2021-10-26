import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { MiniBlockService } from "./mini.block.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  providers: [
    MiniBlockService,
  ],
  exports: [
    MiniBlockService,
  ]
})
export class MiniBlockModule { }