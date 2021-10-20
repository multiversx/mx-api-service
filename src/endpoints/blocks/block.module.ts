import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { BlsModule } from "../bls/bls.module";
import { BlockService } from "./block.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    BlsModule
  ],
  providers: [
    BlockService,
  ],
  exports: [
    BlockService,
  ]
})
export class BlockModule { }