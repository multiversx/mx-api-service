import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('accounts_esdt_history')
export class AccountsEsdtHistoryDb {
  @PrimaryColumn()
  address: string = '';

  @PrimaryColumn()
  timestamp: number = 0;

  @Column({ nullable: true })
  balance: string = '0';

  @PrimaryColumn()
  token: string = '';

  @Column({ nullable: true })
  identifier: string = '';

  @PrimaryColumn({ name: 'token_nonce' })
  tokenNonce: number = 0;

  @Column({ nullable: true, name: 'is_sender' })
  isSender: boolean = false;

  @Column({ nullable: true, name: 'is_smart_contract' })
  isSmartContract: boolean = false;
}
