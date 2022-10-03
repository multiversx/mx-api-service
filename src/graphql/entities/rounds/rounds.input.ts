import { Field, Float, InputType } from "@nestjs/graphql";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";

@InputType({ description: "Input to retreive the given rounds count for." })
export class GetRoundsCountInput {
  constructor(partial?: Partial<GetRoundsCountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "validator", description: "Validator for the given result set.", nullable: true })
  validator: string | undefined = undefined;

  // This property filter need to be adjusted in erdnest
  // @Field(() => QueryConditionOptions, { name: "condition", description: "Condition filter for the given result set.", nullable: true })
  // condition: QueryConditionOptions | undefined;

  @Field(() => Float, { name: "shard", description: "Shard ID for the given result set.", nullable: true })
  shard: number | undefined = undefined;

  @Field(() => Float, { name: "epoch", description: "Epoch for the given result set.", nullable: true })
  epoch: number | undefined = undefined;

  public static resolve(input: GetRoundsCountInput): RoundFilter {
    return new RoundFilter({
      validator: input.validator,
      shard: input.shard,
      epoch: input.epoch,
    });
  }
}

@InputType({ description: "Input to retrieve the given rounds for." })
export class GetRoundsInput extends GetRoundsCountInput {
  constructor(partial?: Partial<GetRoundsInput>) {
    super();

    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of blocks to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of blocks to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;
}

@InputType({ description: "Input to retrieve the given rounds for." })
export class GetRoundInput {
  constructor(partial?: Partial<GetRoundInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "shard", description: "Epoch for the given result set." })
  shard!: number;

  @Field(() => Float, { name: "round", description: "Round for the given result set." })
  round!: number;

  public static resolve(input: GetRoundInput) {
    return input.shard, input.round;
  }
}
