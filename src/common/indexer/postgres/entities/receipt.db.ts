import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('receipts')
export class ReceiptDb {
  @PrimaryColumn()
  hash: string = '';

  @Column({ nullable: true })
  value: string = '0';

  @Column({ nullable: true })
  sender: string = '';

  @Column({ nullable: true })
  data: string = '';

  @Column({ nullable: true, name: 'tx_hash' })
  txHash: string = '';

  @Column({ nullable: true })
  timestamp: number = 0;
}
