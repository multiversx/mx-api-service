import { TypeormUtils } from "src/utils/typeorm.utils";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('blocks')
export class BlockDb {
  @PrimaryColumn()
  hash: string = '';

  @Column({ nullable: true })
  nonce: number = 0;

  @Column({ nullable: true })
  round: number = 0;

  @Column({ nullable: true })
  epoch: number = 0;

  @Column('text', { nullable: true, name: 'mini_blocks_hashes', transformer: TypeormUtils.textToStringArrayTransformer })
  miniBlocksHashes: string[] = [];

  @Column('text', { nullable: true, name: 'notarized_blocks_hashes', transformer: TypeormUtils.textToStringArrayTransformer })
  notarizedBlocksHashes?: string;

  @Column({ nullable: true })
  proposer: number = 0;

  @Column('text', { nullable: true, transformer: TypeormUtils.textToNumberArrayTransformer })
  validators: number[] = [];

  @Column({ nullable: true, name: 'pub_key_bitmap' })
  publicKeyBitmap: number = 0;

  @Column({ nullable: true })
  size: number = 0;

  @Column({ nullable: true, name: 'size_txs' })
  sizeTxs: number = 0;

  @Column({ nullable: true })
  timestamp: number = 0;

  @Column({ nullable: true, name: 'state_root_hash' })
  stateRootHash: string = '';

  @Column({ nullable: true, name: 'prev_hash' })
  prevHash: string = '';

  @Column({ nullable: true, name: 'shard_id' })
  shardId: number = 0;

  @Column({ nullable: true, name: 'tx_count' })
  txCount: number = 0;

  @Column({ nullable: true, name: 'notarized_txs_count' })
  notarizedTxsCount: number = 0;

  @Column({ nullable: true, name: 'accumulated_fees' })
  accumulatedFees: string = '';

  @Column({ nullable: true, name: 'developer_fees' })
  developerFees: string = '';

  @Column({ nullable: true, name: 'epoch_start_block' })
  epochStartBlock: boolean = false;

  @Column({ nullable: true, name: 'search_order' })
  searchOrder: number = 0;

  @Column({ nullable: true, name: 'gas_provided' })
  gasProvided: number = 0;

  @Column({ nullable: true, name: 'gas_refunded' })
  gasRefunded: number = 0;

  @Column({ nullable: true, name: 'gas_penalized' })
  gasPenalized: number = 0;

  @Column({ nullable: true, name: 'max_gas_limit' })
  maxGasLimit: number = 0;

  @Column({ nullable: true, name: 'scheduled_root_hash' })
  scheduledRootHash: string = '';

  @Column({ nullable: true, name: 'scheduled_accumulated_fees' })
  scheduledAccumulatedFees: string = '';

  @Column({ nullable: true, name: 'scheduled_developer_fees' })
  scheduledDeveloperFees: string = '';

  @Column({ nullable: true, name: 'scheduled_gas_provided' })
  scheduledGasProvided: number = 0;

  @Column({ nullable: true, name: 'scheduled_gas_penalized' })
  scheduledGasPenalized: number = 0;

  @Column({ nullable: true, name: 'scheduled_gas_refunded' })
  scheduledGasRefunded: number = 0;
}
