import { Field, Float, ID, InputType } from "@nestjs/graphql";
import { QueryPagination } from "src/common/entities/query.pagination";

@InputType({ description: "Input to retrieve the given mex tokens for." })
export class GetMexTokensInput {
  constructor(partial?: Partial<GetMexTokensInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of mex tokens to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of mex tokens to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  public static resolve(input: GetMexTokensInput): QueryPagination {
    return { from: input.from, size: input.size };
  }
}

@InputType({ description: "Input to retrieve the given mex token for." })
export class GetMexTokenInput {
  constructor(partial?: Partial<GetMexTokenInput>) {
    Object.assign(this, partial);
  }

  @Field(() => ID, { name: "id", description: "Identifier to retrieve the corresponding mex token for." })
  id: string = "";

  public static resolve(input: GetMexTokenInput): string {
    return input.id;
  }
}
