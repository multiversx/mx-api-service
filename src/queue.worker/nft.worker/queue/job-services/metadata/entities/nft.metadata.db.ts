import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class NftMetadataDb {
  @PrimaryColumn()
  id?: string;

  @Column()
  description: string = '';

  @Column()
  fileType: string = '';

  @Column()
  fileUri: string = '';

  @Column()
  fileName: string = '';
}