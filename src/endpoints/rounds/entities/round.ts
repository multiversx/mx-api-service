import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("Round", { description: "Round object type." })
export class Round {
  constructor(init?: Partial<Round>) {
    Object.assign(this, init);
  }

  @Field(() => Boolean, { description: "Block proposer for the given round." })
  @ApiProperty({ type: Boolean, default: false })
  blockWasProposed: boolean = false;

  @Field(() => Float, { description: "Round number details." })
  @ApiProperty({ type: Number, example: 9171722 })
  round: number = 0;

  @Field(() => Float, { description: "Shard ID for the given round." })
  @ApiProperty({ type: Number, example: 1 })
  shard: number = 0;

  @Field(() => Float, { description: "Epoch for the given round." })
  @ApiProperty({ type: Number, example: 636 })
  epoch: number = 0;

  @Field(() => Float, { description: "Timestamp for the given round." })
  @ApiProperty({ type: Number, example: 1651148112 })
  timestamp: number = 0;
}
