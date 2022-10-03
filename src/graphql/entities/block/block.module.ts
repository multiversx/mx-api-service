import { Module } from "@nestjs/common";
import { BlockModule as InternalBlockModule } from "src/endpoints/blocks/block.module";
import { BlockResolver } from "./block.resolver";

@Module({
  imports: [InternalBlockModule],
  providers: [BlockResolver],
})
export class BlockModule { }
