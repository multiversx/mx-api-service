import { Field, Float, ID, InputType } from "@nestjs/graphql";
import { SortOrder } from "src/common/entities/sort.order";

import { EsdtDataSource } from "src/endpoints/esdt/entities/esdt.data.source";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { TransactionStatus } from "src/endpoints/transactions/entities/transaction.status";

@InputType({ description: "Input to retrieve the given detailed account for." })
export class GetAccountDetailedInput {
  constructor(partial?: Partial<GetAccountDetailedInput>) {
    Object.assign(this, partial);
  }

  @Field(() => ID, { name: "address", description: "Address to retrieve the corresponding detailed account for." })
  address: string = "";

  public static resolve(input: GetAccountDetailedInput): string {
    return input.address;
  }
}

@InputType({ description: "Input to retrieve the given from and size for." })
export class GetFromAndSizeInput {
  constructor(partial?: Partial<GetFromAndSizeInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of collections to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of collections to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;
}

@InputType({ description: "Input to retrieve the given NFT collections for." })
export class GetNftCollectionsAccountInput {
  constructor(partial?: Partial<GetNftCollectionsAccountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of NFT collections to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of NFT collections to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => ID, { name: "search", description: "Collection identifier to retrieve for the given result set.", nullable: true })
  search: string | undefined = undefined;

  @Field(() => [NftType], { name: "type", description: "NFT types list to retrieve for the given result set.", nullable: true })
  type: Array<NftType> | undefined = undefined;
}

@InputType({ description: "Input to retrieve the given NFTs for." })
export class GetNftsAccountInput {
  constructor(partial?: Partial<GetNftsAccountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of collections to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of collections to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => String, { name: "search", description: "NFT identifier to retrieve for the given result set.", nullable: true })
  search: string | undefined = undefined;

  @Field(() => [ID], { name: "identifiers", description: "NFT comma-separated identifiers list to retrieve for the given result set.", nullable: true })
  identifiers: Array<string> | undefined = undefined;

  @Field(() => NftType, { name: "type", description: "NFT type to retrieve for the given result set.", nullable: true })
  type: NftType | undefined = undefined;

  @Field(() => [String], { name: "collections", description: "Collections to retrieve for the given result set.", nullable: true })
  collections: Array<string> | undefined = undefined;

  @Field(() => String, { name: "name", description: "Name to retrieve for the given result set.", nullable: true })
  name: string | undefined = undefined;

  @Field(() => [String], { name: "tags", description: "Tags list to retrieve for the given result set.", nullable: true })
  tags: Array<string> | undefined = undefined;

  @Field(() => String, { name: "creator", description: "Creator to retrieve for the given result set.", nullable: true })
  creator: string | undefined = undefined;

  @Field(() => Boolean, { name: "hasUris", description: "Has URIs to retrieve for the given result set.", nullable: true })
  hasUris: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "includeFlagged", description: "Include flagged to retrieve for the given result set.", nullable: true })
  includeFlagged: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "withSupply", description: "With supply to retrieve for the given result set.", nullable: true })
  withSupply: boolean | undefined = undefined;

  @Field(() => EsdtDataSource, { name: "source", description: "Source to retrieve for the given result set.", nullable: true })
  source: EsdtDataSource | undefined = undefined;
}

@InputType({ description: "Input to retrieve the given tokens for." })
export class GetTokensAccountInput {
  constructor(partial?: Partial<GetTokensAccountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of tokens to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of tokens to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => String, { name: "search", description: "Token identifier to retrieve for the given result set.", nullable: true })
  search: string | undefined = undefined;

  @Field(() => ID, { name: "identifier", description: "Search by token identifier for the given result set.", nullable: true })
  identifier: string | undefined = undefined;

  @Field(() => [String], { name: "identifiers", description: "Token comma-separated identifiers list to retrieve for the given result set.", nullable: true })
  identifiers: Array<string> | undefined = undefined;

  @Field(() => String, { name: "name", description: "Name to retrieve for the given result set.", nullable: true })
  name: string | undefined = undefined;
}

@InputType({ description: "Input to retrieve the given transactions for." })
export class GetTransactionsAccountInput {
  constructor(partial?: Partial<GetTransactionsAccountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of transactions to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of transactions to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => String, { name: "sender", description: "Sender for the given result set.", nullable: true })
  sender: string | undefined = undefined;

  @Field(() => [String], { name: "receiver", description: "Receiver for the given result set.", nullable: true })
  receiver: string[] | undefined = undefined;

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

  @Field(() => SortOrder, { name: "order", description: "Order transactions for the given result set.", nullable: true })
  order: SortOrder | undefined = undefined;

  @Field(() => Boolean, { name: "withScResults", description: "After timestamp for the given result set.", nullable: true })
  withScResults: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "withOperations", description: "After timestamp for the given result set.", nullable: true })
  withOperations: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "withLogs", description: "After timestamp for the given result set.", nullable: true })
  withLogs: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "withScamInfo", description: "After timestamp for the given result set.", nullable: true })
  withScamInfo: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "withUsername", description: "After timestamp for the given result set.", nullable: true })
  withUsername: boolean | undefined = undefined;
}

@InputType({ description: "Input to retrieve the given transactions count for." })
export class GetTransactionsAccountCountInput {
  constructor(partial?: Partial<GetTransactionsAccountCountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "sender", description: "Sender for the given result set.", nullable: true })
  sender: string | undefined = undefined;

  @Field(() => [String], { name: "receiver", description: "Receiver for the given result set.", nullable: true })
  receiver: string[] | undefined = undefined;

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
}

@InputType({ description: "Input to retrieve the given transfers for." })
export class GetTransfersAccountInput {
  constructor(partial?: Partial<GetTransfersAccountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of transactions to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of transactions to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => String, { name: "sender", description: "Sender for the given result set.", nullable: true })
  sender: string | undefined = undefined;

  @Field(() => [String], { name: "receiver", description: "Receiver for the given result set.", nullable: true })
  receiver: string[] | undefined = undefined;

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

  @Field(() => SortOrder, { name: "order", description: "Order transactions for the given result set.", nullable: true })
  order: SortOrder | undefined = undefined;

  @Field(() => Boolean, { name: "withScamInfo", description: "After timestamp for the given result set.", nullable: true })
  withScamInfo: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "withUsername", description: "After timestamp for the given result set.", nullable: true })
  withUsername: boolean | undefined = undefined;
}

@InputType({ description: "Input to retrieve the given history token for." })
export class GetHistoryTokenAccountInput extends GetFromAndSizeInput {
  constructor(partial?: Partial<GetFromAndSizeInput>) {
    super();
    Object.assign(this, partial);
  }
  @Field(() => ID, { name: "identifier", description: "Identifier token to retrieve for the given result set." })
  identifier: string = "";
}



