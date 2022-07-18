import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('upgrades')
export class UpgradeDb {
  @PrimaryColumn({ name: 'tx_hash' })
  txHash: string = '';

  @Column({ nullable: true })
  upgrader: string = '';

  @PrimaryColumn()
  timestamp: number = 0;
}
