import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity('nft_media')
@Index(['id'], { unique: true })
export class NftMediaDb {
  // dummy
  @ObjectIdColumn()
  identifier?: string;

  @Column()
  id: string = '';

  @Column('json')
  content?: any;
}
