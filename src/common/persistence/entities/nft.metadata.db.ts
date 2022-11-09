import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity('nft_metadata')
@Index(['id'], { unique: true })
export class NftMetadataDb {
  // dummy
  @ObjectIdColumn()
  identifier?: string;

  @Column()
  id: string = '';

  @Column('json')
  content: any;
}
