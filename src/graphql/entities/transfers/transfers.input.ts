import { Field, Float, InputType } from "@nestjs/graphql";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionStatus } from "src/endpoints/transactions/entities/transaction.status";

@InputType({ description: "Input to retreive the given transfers count for." })
export class GetTransfersCountInput {
  constructor(partial?: Partial<GetTransfersCountInput>) {
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

  @Field(() => Float, { name: "before", description: "Before timestamp for the given result set.", nullable: true })
  before: number | undefined = undefined;

  @Field(() => Float, { name: "after", description: "After timestamp for the given result set.", nullable: true })
  after: number | undefined = undefined;

  @Field(() => SortOrder, { name: "order", description: "SortOrder data transfers for the given result set.", nullable: true })
  order: SortOrder | undefined = undefined;

  public static resolve(input: GetTransfersCountInput): TransactionFilter {
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
      before: input.before,
      after: input.after,
      order: input.order,
    });
  }
}
@InputType({ description: "Input to retrieve the given transfers for." })
export class GetTransfersInput extends GetTransfersCountInput {
  constructor(partial?: Partial<GetTransfersInput>) {
    super();
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of transfers to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of transfers to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;
}
