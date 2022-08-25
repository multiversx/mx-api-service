import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('sc_results')
export class ScResultDb {
  @PrimaryColumn()
  hash: string = '';

  @Column({ nullable: true, name: 'mb_hash' })
  mbHash: string = '';

  @Column({ nullable: true })
  nonce: number = 0;

  @Column({ nullable: true, name: 'gas_limit' })
  gasLimit: number = 0;

  @Column({ nullable: true, name: 'gas_price' })
  gasPrice: number = 0;

  @Column({ nullable: true })
  value: string = '';

  @Column({ nullable: true })
  sender: string = '';

  @Column({ nullable: true })
  receiver: string = '';

  @Column({ nullable: true, name: 'sender_shard' })
  senderShard: number = 0;

  @Column({ nullable: true, name: 'receiver_shard' })
  receiverShard: number = 0;

  @Column({ nullable: true, name: 'relayer_addr' })
  relayerAddr: string = '';

  @Column({ nullable: true, name: 'relayed_value' })
  relayedValue: string = '';

  @Column({ nullable: true })
  code: string = '';

  @Column({ nullable: true })
  data: string = '';

  @Column({ nullable: true, name: 'prev_tx_hash' })
  prevTxHash: string = '';

  @Column({ nullable: true, name: 'original_tx_hash' })
  originalTxHash: string = '';

  @Column({ nullable: true, name: 'call_type' })
  callType: string = '';

  @Column({ nullable: true, name: 'code_metadata' })
  codeMetadata: string = '';

  @Column({ nullable: true, name: 'return_message' })
  returnMessage: string = '';

  @Column({ nullable: true })
  timestamp: number = 0;

  @Column({ nullable: true, name: 'has_operations' })
  hasOperations: boolean = false;

  @Column({ nullable: true })
  type: string = '';

  @Column({ nullable: true })
  status: string = '';

  @Column({ nullable: true })
  tokens: string = '';

  @Column({ nullable: true, name: 'esdt_values' })
  esdtValues: string = '';

  @Column({ nullable: true })
  receivers: string = '';

  @Column({ nullable: true, name: 'receivers_shard_ids' })
  receiversShardIds: string = '';

  @Column({ nullable: true })
  operation: string = '';

  @Column({ nullable: true })
  function: string = '';

  @Column({ nullable: true, name: 'is_relayed' })
  isRelayed: boolean = false;

  @Column({ nullable: true, name: 'can_be_ignored' })
  canBeIgnored: boolean = false;

  @Column({ nullable: true, name: 'original_sender' })
  originalSender: string = '';

  @Column({ nullable: true, name: 'sender_address_bytes' })
  senderAddressBytes: string = '';
}
