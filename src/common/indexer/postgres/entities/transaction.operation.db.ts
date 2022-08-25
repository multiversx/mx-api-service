import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('txs_operations')
export class TransactionOperationDb {
  @PrimaryColumn()
  hash: string = '';

  @Column({ nullable: true, name: 'mb_hash' })
  mbHash: string = '';

  @Column({ nullable: true })
  nonce: number = 0;

  @Column({ nullable: true })
  round: number = 0;

  @Column({ nullable: true })
  value: string = '';

  @Column({ nullable: true })
  receiver: string = '';

  @Column({ nullable: true })
  sender: string = '';

  @Column({ nullable: true, name: 'receiver_shard' })
  receiverShard: number = 0;

  @Column({ nullable: true, name: 'sender_shard' })
  senderShard: number = 0;

  @Column({ nullable: true, name: 'gas_price' })
  gasPrice: number = 0;

  @Column({ nullable: true, name: 'gas_limit' })
  gasLimit: number = 0;

  @Column({ nullable: true, name: 'gas_used' })
  gasUsed: number = 0;

  @Column({ nullable: true })
  fee: string = '';

  @Column({ nullable: true })
  data: string = '';

  @Column({ nullable: true })
  signature: string = '';

  @Column({ nullable: true })
  timestamp: number = 0;

  @Column({ nullable: true })
  status: string = '';

  @Column({ nullable: true, name: 'search_order' })
  searchOrder: number = 0;

  @Column({ nullable: true, name: 'sender_user_name' })
  senderUserName: string = '';

  @Column({ nullable: true, name: 'receiver_user_name' })
  receiverUserName: string = '';

  @Column({ nullable: true, name: 'has_scr' })
  hasScr: boolean = false;

  @Column({ nullable: true, name: 'is_sc_call' })
  isScCall: boolean = false;

  @Column({ nullable: true, name: 'has_operations' })
  hasOperations: boolean = false;

  @Column({ nullable: true })
  tokens: string = '';

  @Column({ nullable: true, name: 'esdt_values' })
  esdtValues: string = '';

  @Column({ nullable: true })
  receivers: string = '';

  @Column({ nullable: true, name: 'receivers_shard_ids' })
  receiversShardIds: string = '';

  @Column({ nullable: true })
  type: string = '';

  @Column({ nullable: true })
  operation: string = '';

  @Column({ nullable: true })
  function: string = '';

  @Column({ nullable: true, name: 'is_relayed' })
  isRelayed: boolean = false;

  @Column({ nullable: true })
  version: number = 0;

  @Column({ nullable: true, name: 'receiver_address_bytes' })
  receiverAddressBytes: string = '';

  @Column({ nullable: true, name: 'block_hash' })
  blockHash: string = '';
}
