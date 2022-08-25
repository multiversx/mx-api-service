import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('epoch_info')
export class EpochInfoDb {
  @PrimaryColumn()
  epoch: number = 0;

  @Column({ nullable: true, name: 'accumulated_fees' })
  accumulatedFees: string = '0';

  @Column({ nullable: true, name: 'developer_fees' })
  developerFees: string = '0';
}
