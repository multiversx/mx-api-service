import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class NftMetadataDb {
  @PrimaryColumn()
  id?: string;

  @Column()
  json?: string;
}