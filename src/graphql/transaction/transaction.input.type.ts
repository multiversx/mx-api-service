import { QueryConditionOptions } from "@elrondnetwork/erdnest";
import { Field, Float, InputType } from "@nestjs/graphql";
import { SortOrder } from "src/common/entities/sort.order";

import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionStatus } from "src/endpoints/transactions/entities/transaction.status";

@InputType({ description: "Get transactions count input." })
export class GetTransactionsCountInput {
  @Field(() => String, { name: "sender", description: "Address of the transaction sender for the given result set.", nullable: true })
  sender: string | undefined = undefined;

  @Field(() => String, { name: "receiver", description: "Address of the transaction receiver for the given result set.", nullable: true })
  receiver: string | undefined = undefined;

  @Field(() => String, { name: "token", description: "Token identfier for the given result set.", nullable: true })
  token: string | undefined = undefined;

  @Field(() => Float, { name: "senderShard", description: "Sender shard identfier for the given result set.", nullable: true })
  senderShard: number | undefined = undefined;

  @Field(() => Float, { name: "receiverShard", description: "Receiver shard identfier for the given result set.", nullable: true })
  receiverShard: number | undefined = undefined;

  @Field(() => String, { name: "miniBlockHash", description: "Mini block hash for the given result set.", nullable: true })
  miniBlockHash: string | undefined = undefined;

  @Field(() => [String], { name: "hashes", description: "Filter by a comma-separated list of transaction hashes for the given result set.", nullable: true })
  hashes: string[] | undefined = undefined;

  @Field(() => TransactionStatus, { name: "status", description: "Status of the transaction (success / pending / invalid / fail) for the given result set.", nullable: true })
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
      receiver: input.receiver,
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

@InputType({ description: "Get transactions input." })
export class GetTransactionsInput extends GetTransactionsCountInput {
  @Field(() => Float, { name: "from", description: "Number of transactions to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of transactions to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => SortOrder, { name: "condition", description: "Sort order (ascending / descending) for the given result set.", nullable: true })
  order: SortOrder | undefined = undefined;

  @Field(() => Boolean, { name: "withScResults", description: "If to return smart contract results for the given result set.", nullable: true })
  withSmartContractResults: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "withOperations", description: "If to return operations for the given result set.", nullable: true })
  withOperations: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "withLogs", description: "If to return logs for the given result set.", nullable: true })
  withLogs: boolean | undefined = undefined;
}

@InputType({ description: "Get transaction input." })
export class GetTransactionInput {
  @Field(() => String, { name: "hash", description: "Hash to retrieve the corresponding transaction." })
  hash: string = "";

  public static resolve(input: GetTransactionInput): string {
    return input.hash;
  }
}
