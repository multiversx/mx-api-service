import { Entity, Index, PrimaryColumn, ObjectIdColumn } from 'typeorm';

@Entity('transaction')
@Index(['txHash'], { unique: true })
export class TransactionDb {
  // dummy
  @ObjectIdColumn()
  identifier?: string;

  @PrimaryColumn()
  txHash: string = '';
}
