import { QueryConditionOptions } from "@elrondnetwork/erdnest";
import { Field, Float, InputType } from "@nestjs/graphql";

import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionStatus } from "src/endpoints/transactions/entities/transaction.status";

@InputType({ description: "Input to retrieve the given transactions count for." })
export class GetTransactionsCountInput {
  constructor(partial?: Partial<GetTransactionsCountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "sender", description: "Sender for the given result set.", nullable: true })
  sender: string | undefined = undefined;

  @Field(() => String, { name: "receiver", description: "Receiver for the given result set.", nullable: true })
  receiver: string | undefined = undefined;

  @Field(() => String, { name: "token", description: "Token identfier for the given result set.", nullable: true })
  token: string | undefined = undefined;

  @Field(() => Float, { name: "senderShard", description: "Sender shard for the given result set.", nullable: true })
  senderShard: number | undefined = undefined;

  @Field(() => Float, { name: "receiverShard", description: "Receiver shard for the given result set.", nullable: true })
  receiverShard: number | undefined = undefined;

  @Field(() => String, { name: "miniBlockHash", description: "Mini block hash for the given result set.", nullable: true })
  miniBlockHash: string | undefined = undefined;

  @Field(() => [String], { name: "hashes", description: "Filter by a comma-separated list of transaction hashes for the given result set.", nullable: true })
  hashes: Array<string> | undefined = undefined;

  @Field(() => TransactionStatus, { name: "status", description: "Status of the transaction for the given result set.", nullable: true })
  status: TransactionStatus | undefined = undefined;

  @Field(() => String, { name: "search", description: "Search in data object for the given result set.", nullable: true })
  search: string | undefined = undefined;

  @Field(() => String, { name: "function", description: "Filter transactions by function name for the given result set.", nullable: true })
  function: string | undefined = undefined;

  @Field(() => Float, { name: "before", description: "Before timestamp for the given result set.", nullable: true })
  before: number | undefined = undefined;

  @Field(() => Float, { name: "after", description: "After timestamp for the given result set.", nullable: true })
  after: number | undefined = undefined;

  @Field(() => String, { name: "condition", description: "Condition for ElasticSearch queries for the given result set.", nullable: true })
  condition: QueryConditionOptions | undefined = undefined;

  public static resolve(input: GetTransactionsCountInput): TransactionFilter {
    return new TransactionFilter({
      sender: input.sender,
      receivers: input.receiver ? [input.receiver] : [],
      token: input.token,
      senderShard: input.senderShard,
      receiverShard: input.receiverShard,
      miniBlockHash: input.miniBlockHash,
      hashes: input.hashes,
      status: input.status,
      search: input.search,
      function: input.function,
      before: input.before,
      after: input.after,
      condition: input.condition,
    });
  }
}
