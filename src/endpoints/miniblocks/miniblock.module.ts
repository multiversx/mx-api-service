import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { MiniBlockController } from "./mini.block.controller";
import { MiniBlockService } from "./mini.block.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  controllers: [
    MiniBlockController,
  ],
  providers: [
    MiniBlockService,
  ],
  exports: [
    MiniBlockService,
  ]
})
export class MiniBlockModule { }