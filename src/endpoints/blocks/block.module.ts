import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { BlockController } from "./block.controller";
import { BlockService } from "./block.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  controllers: [
    BlockController,
  ],
  providers: [
    BlockService,
  ],
  exports: [
    BlockService,
  ]
})
export class BlockModule { }