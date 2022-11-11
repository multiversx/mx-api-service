import { Module } from "@nestjs/common";
import { MiniBlockModule as InternalMiniBlockModule } from "src/endpoints/miniblocks/miniblock.module";
import { MiniBlockResolver } from "./mini.block.resolver";
@Module({
  imports: [InternalMiniBlockModule],
  providers: [MiniBlockResolver],
})
export class MiniBlockModule { }
