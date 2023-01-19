import { Entity, Index, PrimaryColumn, ObjectIdColumn } from 'typeorm';

@Entity('transaction')
@Index(['tx_hash'], { unique: true })
export class TransactionDb {
    // dummy
    @ObjectIdColumn()
    identifier?: string;

    @PrimaryColumn()
    tx_hash: string = '';
}
