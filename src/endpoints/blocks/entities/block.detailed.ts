import { ApiProperty } from "@nestjs/swagger";
import { Block } from "./block";

export class BlockDetailed extends Block {
  constructor(init?: Partial<BlockDetailed>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ type: [String] })
  miniBlocksHashes: string[] = [];

  @ApiProperty({ type: [String] })
  notarizedBlocksHashes: string[] = [];

  @ApiProperty({ type: [String] })
  validators: string[] = [];
}
