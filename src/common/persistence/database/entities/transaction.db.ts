import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('transactions')
export class TransactionDb {
  @PrimaryColumn()
  txHash?: string;

  @Column('json')
  body?: any;
}
