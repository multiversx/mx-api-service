import { ApiUtils } from "@elrondnetwork/erdnest";
import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { Identity } from "src/endpoints/identities/entities/identity";

@ObjectType("Block", { description: "Block object type." })
export class Block {
  constructor(init?: Partial<Block>) {
    Object.assign(this, init);
  }

  @Field(() => ID, { description: "Hash for the given Block." })
  @ApiProperty({ type: String })
  hash: string = '';

  @Field(() => Float, { description: "Epoch for the given Block." })
  @ApiProperty({ type: Number })
  epoch: number = 0;

  @Field(() => ID, { description: "Nonce for the given Block." })
  @ApiProperty({ type: Number })
  nonce: number = 0;

  @Field(() => ID, { description: "Previous Hash for the given Block." })
  @ApiProperty({ type: String })
  prevHash: string = '';

  @Field(() => ID, { description: "Proposer for the given Block." })
  @ApiProperty({ type: String })
  proposer: string = '';

  @Field(() => ID, { description: "Proposer Identity for the given Block." })
  @ApiProperty({ type: Identity, nullable: true })
  proposerIdentity: Identity | undefined = undefined;

  @Field(() => ID, { description: "Public Key Bitmap for the given Block." })
  @ApiProperty({ type: String })
  pubKeyBitmap: string = '';

  @Field(() => ID, { description: "Round for the given Block." })
  @ApiProperty({ type: Number })
  round: number = 0;

  @Field(() => ID, { description: "Shard for the given Block." })
  @ApiProperty({ type: Number })
  shard: number = 0;

  @Field(() => ID, { description: "Size for the given Block." })
  @ApiProperty({ type: Number })
  size: number = 0;

  @Field(() => ID, { description: "Size Txs for the given Block." })
  @ApiProperty({ type: Number })
  sizeTxs: number = 0;

  @Field(() => ID, { description: "State Root Hash for the given Block." })
  @ApiProperty({ type: String })
  stateRootHash: string = '';

  @Field(() => ID, { description: "Timestamp for the given Block." })
  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @Field(() => ID, { description: "TxCount for the given NFT." })
  @ApiProperty({ type: Number })
  txCount: number = 0;

  @Field(() => ID, { description: "Gas Consumed for the given NFT." })
  @ApiProperty({ type: Number })
  gasConsumed: number = 0;

  @Field(() => ID, { description: "Gas Refunded for the given NFT." })
  @ApiProperty({ type: Number })
  gasRefunded: number = 0;

  @Field(() => ID, { description: "Gas Penalized for the given NFT." })
  @ApiProperty({ type: Number })
  gasPenalized: number = 0;

  @Field(() => ID, { description: "Max Gas Limit for the given NFT." })
  @ApiProperty({ type: Number })
  maxGasLimit: number = 0;

  static mergeWithElasticResponse<T extends Block>(newBlock: T, blockRaw: any): T {
    blockRaw.shard = blockRaw.shardId;

    if (blockRaw.gasProvided) {
      blockRaw.gasConsumed = blockRaw.gasProvided;
    }

    if (blockRaw.scheduledData?.rootHash) {
      blockRaw.maxGasLimit = blockRaw.maxGasLimit * 2;
    }

    return ApiUtils.mergeObjects(newBlock, blockRaw);
  }
}
