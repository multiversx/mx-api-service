import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('nft_metadata')
export class NftMetadataDb {
  @PrimaryColumn()
  id: string = '';

  @Column('json')
  content: any;
}