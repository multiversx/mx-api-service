import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('accounts_esdt')
export class AccountsEsdtDb {
  @PrimaryColumn()
  address: string = '';

  @Column({ nullable: true })
  nonce: number = 0;

  @Column({ nullable: true })
  balance: string = '0';

  @Column({ nullable: true, name: 'balance_num' })
  balanceNum: number = 0;

  @PrimaryColumn({ name: 'token_name' })
  tokenName: string = '';

  @Column({ nullable: true, name: 'token_identifier' })
  tokenIdentifier: string = '';

  @PrimaryColumn({ name: 'token_nonce' })
  tokenNonce: number = 0;

  @Column({ nullable: true })
  properties: string = '';

  @Column({ nullable: true, name: 'total_balance_with_stake' })
  totalBalanceWithStake: string = '0';

  @Column({ nullable: true, name: 'total_balance_with_stake_num' })
  totalBalanceWithStakeNum: number = 0;
}
