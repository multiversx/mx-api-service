import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class NftMediaDb {
  @PrimaryColumn()
  id?: string;

  @Column()
  json?: string;
}