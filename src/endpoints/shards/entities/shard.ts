import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("Shard", { description: "Shard object type." })
export class Shard {
  constructor(init?: Partial<Shard>) {
    Object.assign(this, init);
  }

  @Field(() => Float, { description: "Shard details." })
  @ApiProperty({ type: Number, example: 1 })
  shard: number = 0;

  @Field(() => Float, { description: "Total number of validators." })
  @ApiProperty({ type: Number, example: 800 })
  validators: number = 0;

  @Field(() => Float, { description: "Total number of active validators." })
  @ApiProperty({ type: Number, example: 800 })
  activeValidators: number = 0;
}
