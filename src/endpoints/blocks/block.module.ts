import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { BlockService } from "./block.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  providers: [
    BlockService,
  ],
  exports: [
    BlockService,
  ]
})
export class BlockModule { }