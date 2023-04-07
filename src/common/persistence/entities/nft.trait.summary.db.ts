import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity('nft_trait_summaries')
export class NftTraitSummaryDb {
  // dummy
  @ObjectIdColumn()
  id?: string;

  @Column()
  identifier: string = '';

  @Column('json')
  traitTypes: any;
}
