import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('epoch_start_infos')
export class EpochStartInfosDb {
  @PrimaryColumn()
  hash: string = '';

  @Column({ nullable: true, name: 'total_supply' })
  totalSupply: string = '0';

  @Column({ nullable: true, name: 'total_to_distribute' })
  totalToDistribute: string = '0';

  @Column({ nullable: true, name: 'total_newly_minted' })
  totalNewlyMinted: string = '0';

  @Column({ nullable: true, name: 'rewards_per_block' })
  rewardsPerBlock: string = '0';

  @Column({ nullable: true, name: 'rewards_for_protocol_sustainability' })
  rewardsForProtocolSustainability: string = '0';

  @Column({ nullable: true, name: 'node_price' })
  nodePrice: string = '0';

  @Column({ nullable: true, name: 'prev_epoch_start_round' })
  prev_epoch_start_round: number = 0;

  @Column({ nullable: true, name: 'prev_epoch_start_hash' })
  prev_epoch_start_hash: string = '';
}
