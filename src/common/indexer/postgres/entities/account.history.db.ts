import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('accounts_history')
export class AccountHistoryDb {
  @PrimaryColumn()
  address: string = '';

  @PrimaryColumn()
  timestamp: number = 0;

  @Column({ nullable: true })
  balance: string = '0';

  @Column({ nullable: true })
  token: string = '';

  @Column({ nullable: true })
  identifier: string = '';

  @Column({ nullable: true, name: 'token_nonce' })
  tokenNonce: number = 0;

  @Column({ nullable: true, name: 'is_sender' })
  isSender: boolean = false;

  @Column({ nullable: true, name: 'is_smart_contract' })
  isSmartContract: boolean = false;
}
