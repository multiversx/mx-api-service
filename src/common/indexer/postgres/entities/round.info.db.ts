import { TypeormUtils } from 'src/utils/typeorm.utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('round_infos')
export class RoundInfoDb {
  @PrimaryColumn()
  index: string = '';

  @Column('text', { nullable: true, name: 'signers_indexes', transformer: TypeormUtils.textToNumberArrayTransformer })
  signersIndexes: number[] = [];

  @Column({ nullable: true, name: 'block_was_proposed' })
  blockWasProposed: boolean = false;

  @PrimaryColumn({ name: 'shard_id' })
  shardId: number = 0;

  @Column({ nullable: true })
  epoch: number = 0;

  @Column({ nullable: true })
  timestamp: number = 0;
}
