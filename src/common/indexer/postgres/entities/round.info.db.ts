import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('round_infos')
export class RoundInfoDb {
  @PrimaryColumn()
  index: string = '';

  @Column('text', {
    nullable: true, name: 'signers_indexes', transformer: {
      to: (value: number[]): string => JSON.stringify(value),
      from: (value: string): number[] => JSON.parse(value),
    },
  })
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
