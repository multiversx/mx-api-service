import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { Block } from "./block";

@ObjectType("BlockDetailed", { description: "BlockDetailed object type." })
export class BlockDetailed extends Block {
  constructor(init?: Partial<BlockDetailed>) {
    super();
    Object.assign(this, init);
  }

  @Field(() => [String], { description: "MiniBlockHashes for the given block hash." })
  @ApiProperty({ type: [String] })
  miniBlocksHashes: string[] = [];

  @Field(() => [String], { description: "NotarizedBlocksHashes for the given block hash." })
  @ApiProperty({ type: [String] })
  notarizedBlocksHashes: string[] = [];

  @Field(() => [String], { description: "Validators for the given block hash." })
  @ApiProperty({ type: [String] })
  validators: string[] = [];
}
