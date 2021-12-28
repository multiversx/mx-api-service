import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class NftMediaDb {
  @PrimaryColumn()
  urlHash?: string;

  @Column()
  nftIdentifier?: string;

  @Column()
  url: string = '';

  @Column()
  originalUrl: string = '';

  @Column()
  thumbnailUrl: string = '';

  @Column()
  fileType: string = '';

  @Column()
  fileSize: number = 0;
}