import { Field, InputType, Int } from "@nestjs/graphql";
import { QueryPagination } from "src/common/entities/query.pagination";

@InputType({ description: "Get accounts input." })
export class GetAccountsInput {
  @Field(() => Int, { name: "from", description: "Number of accounts to skip for the given result set.", nullable: true, defaultValue: 0 })
  skip: number = 0;

  @Field(() => Int, { name: "size", description: "Number of accounts to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  public static resolve(input: GetAccountsInput): QueryPagination {
    return { from: input.skip, size: input.size };
  }
}

@InputType({ description: "Get account input." })
export class GetAccountInput {
  @Field(() => String, { name: "address", description: "Address to retrieve the corresponding account." })
  address: string = "";

  public static resolve(input: GetAccountInput): string {
    return input.address;
  }
}
