import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('logs')
export class LogDb {
  @PrimaryColumn()
  id: string = '';

  @Column({ nullable: true, name: 'original_tx_hash' })
  originalTxHash: string = '';

  @Column({ nullable: true })
  address: string = '';

  @Column({ nullable: true })
  timestamp: number = 0;
}
