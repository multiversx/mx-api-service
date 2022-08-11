import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity('transactions')
@Index(['txHash'], { unique: true })
export class TransactionDb {
  // dummy
  @ObjectIdColumn()
  identifier?: string;

  @Column()
  txHash: string = '';

  @Column('json')
  body: any;
}
