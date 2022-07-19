import { Field, Float, InputType } from "@nestjs/graphql";

import { GetTransactionsCountInput } from "src/graphql/entities/transaction/transaction.input";
import { SortOrder } from "src/common/entities/sort.order";

@InputType({ description: "Input to retrieve the given transactions for." })
export class GetTransactionsInput extends GetTransactionsCountInput {
  @Field(() => Float, { name: "from", description: "Number of transactions to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of transactions to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => SortOrder, { name: "condition", description: "Sort order (ascending / descending) for the given result set.", nullable: true })
  order: SortOrder | undefined = undefined;
}

@InputType({ description: "Input to retrieve the given detailed transaction for." })
export class GetTransactionDetailedInput {
  @Field(() => String, { name: "hash", description: "Hash to retrieve the corresponding detailed transaction for." })
  hash: string = "";

  public static resolve(input: GetTransactionDetailedInput): string {
    return input.hash;
  }
}
