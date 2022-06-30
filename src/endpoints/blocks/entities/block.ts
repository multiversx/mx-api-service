import { ApiUtils } from "@elrondnetwork/erdnest";
import { ApiProperty } from "@nestjs/swagger";

export class Block {
  constructor(init?: Partial<Block>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  hash: string = '';

  @ApiProperty({ type: Number })
  epoch: number = 0;

  @ApiProperty({ type: Number })
  nonce: number = 0;

  @ApiProperty({ type: String })
  prevHash: string = '';

  @ApiProperty({ type: String })
  proposer: string = '';

  @ApiProperty({ type: String })
  pubKeyBitmap: string = '';

  @ApiProperty({ type: Number })
  round: number = 0;

  @ApiProperty({ type: Number })
  shard: number = 0;

  @ApiProperty({ type: Number })
  size: number = 0;

  @ApiProperty({ type: Number })
  sizeTxs: number = 0;

  @ApiProperty({ type: String })
  stateRootHash: string = '';

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: Number })
  txCount: number = 0;

  @ApiProperty({ type: Number })
  gasConsumed: number = 0;

  @ApiProperty({ type: Number })
  gasRefunded: number = 0;

  @ApiProperty({ type: Number })
  gasPenalized: number = 0;

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
