import { Entity, Index, PrimaryColumn } from 'typeorm';

@Entity()
@Index(['tx_hash'], { unique: true })
export class TransactionDb {
    @PrimaryColumn()
    tx_hash: string = '';
}
