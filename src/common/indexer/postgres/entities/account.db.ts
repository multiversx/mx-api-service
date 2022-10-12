import { Column, Entity, PrimaryColumn } from "typeorm";
import { Account } from "../../entities";

@Entity('accounts')
export class AccountDb implements Account {
  @PrimaryColumn()
  address: string = '';

  @Column({ nullable: true })
  nonce: number = 0;

  @Column({ nullable: true })
  balance: string = '0';

  @Column({ nullable: true, name: 'balance_num' })
  balanceNum: number = 0;

  @Column({ nullable: true, name: 'total_balance_with_stake' })
  totalBalanceWithStake: string = '0';

  @Column({ nullable: true, name: 'total_balance_with_stake_num' })
  totalBalanceWithStakeNum: number = 0;
}
