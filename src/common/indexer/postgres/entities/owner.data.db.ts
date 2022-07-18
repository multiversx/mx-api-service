import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('owner_data')
export class OwnerDataDb {
  @PrimaryColumn()
  address: string = '';

  @Column({ nullable: true })
  timestamp: number = 0;
}
