import { Column, Entity, PrimaryColumn } from "typeorm";
import { MiniBlock } from "../../entities";

@Entity('miniblocks')
export class MiniBlockDb implements MiniBlock {
  @PrimaryColumn()
  hash: string = '';

  @Column({ nullable: true, name: 'sender_shard_id' })
  senderShard: number = 0;

  @Column({ nullable: true, name: 'receiver_shard_id' })
  receiverShard: number = 0;

  @Column({ nullable: true, name: 'sender_block_hash' })
  senderBlockHash: string = '';

  @Column({ nullable: true, name: 'receiver_block_hash' })
  receiverBlockHash: string = '';

  @Column({ nullable: true })
  type: string = '';

  @Column({ nullable: true, name: 'processing_type_on_destination' })
  procTypeD: string = '';

  @Column({ nullable: true, name: 'processing_type_on_source' })
  procTypeS: string = '';

  @Column({ nullable: true })
  timestamp: number = 0;
}
