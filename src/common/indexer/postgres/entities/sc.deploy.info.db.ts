import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('sc_deploy_infos')
export class ScDeployInfoDb {
  @PrimaryColumn({ name: 'tx_hash' })
  txHash: string = '';

  @Column({ nullable: true })
  creator: string = '';

  @Column({ nullable: true })
  timestamp: number = 0;
}
