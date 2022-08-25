import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('delegators')
export class DelegatorDb {
  @PrimaryColumn()
  address: string = '';

  @Column({ nullable: true })
  contract: string = '';

  @Column({ nullable: true, name: 'active_stake' })
  activeStake: string = '';

  @Column({ nullable: true, name: 'active_stake_num' })
  activeStakeNum: number = 0;

  @Column({ nullable: true, name: 'should_delete' })
  shouldDelete: boolean = false;
}
