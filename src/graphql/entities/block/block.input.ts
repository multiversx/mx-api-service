import { Field, Float, ID, InputType } from "@nestjs/graphql";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";

@InputType({ description: "Input to retrieve the given blocks for." })
export class GetBlocksCountInput {
  constructor(partial?: Partial<GetBlocksCountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "shard", description: "Shard ID for the given result set.", nullable: true })
  shard: number | undefined = undefined;

  @Field(() => String, { name: "proposer", description: "Proposer for the given result set.", nullable: true })
  proposer: string | undefined = undefined;

  @Field(() => String, { name: "validator", description: "Validator for the given result set.", nullable: true })
  validator: string | undefined = undefined;

  @Field(() => Float, { name: "epoch", description: "Epoch for the given result set.", nullable: true })
  epoch: number | undefined = undefined;

  @Field(() => Float, { name: "nonce", description: "Nonce for the given result set.", nullable: true })
  nonce: number | undefined = undefined;

  public static resolve(input: GetBlocksCountInput): BlockFilter {
    return new BlockFilter({
      shard: input.shard,
      proposer: input.proposer,
      validator: input.validator,
      epoch: input.epoch,
      nonce: input.nonce,
    });
  }
}

@InputType({ description: "Input to retrieve the given blocks for." })
export class GetBlocksInput extends GetBlocksCountInput {
  constructor(partial?: Partial<GetBlocksInput>) {
    super();

    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of blocks to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of blocks to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => Boolean, { name: "withProposerIdentity", description: "Provide identity information for proposer node.", nullable: true })
  withProposerIdentity: boolean | undefined;
}

@InputType({ description: "Input to retrieve the given hash block for." })
export class GetBlockHashInput {
  constructor(partial?: Partial<GetBlockHashInput>) {
    Object.assign(this, partial);
  }

  @Field(() => ID, { name: "hash", description: "Specific block hash to retrieve the corresponding blocks for." })
  hash: string = "";

  public static resolve(input: GetBlockHashInput): string {
    return input.hash;
  }
}
