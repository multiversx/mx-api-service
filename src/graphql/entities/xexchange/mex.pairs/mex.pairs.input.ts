import { Field, Float, InputType } from "@nestjs/graphql";

@InputType({ description: "Input to retrieve the given mex tokens pairs for." })
export class GetMexTokenPairsInput {
  constructor(partial?: Partial<GetMexTokenPairsInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of mex tokens pair to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of mex tokens pair to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  public static resolve(input: GetMexTokenPairsInput): number {
    return input.from, input.size;
  }
}

@InputType({ description: "Input to retrieve the given mex tokens pairs by quote and baseId for." })
export class GetMexTokenPairsByQuotePairIdInput {
  constructor(partial?: Partial<GetMexTokenPairsByQuotePairIdInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "baseId", description: "Number of mex tokens pair to skip for the given result set." })
  baseId!: string;

  @Field(() => String, { name: "quoteId", description: "Number of mex tokens pair to retrieve for the given result set." })
  quoteId!: string;

  public static resolve(input: GetMexTokenPairsByQuotePairIdInput): any {
    return input.baseId, input.quoteId;
  }
}



