import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('nft_media')
export class NftMediaDb {
  @PrimaryColumn()
  id?: string;

  @Column('json')
  content?: any;
}
