import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('token_meta_data')
export class TokenMetaDataDb {
  @PrimaryColumn()
  name: string = '';

  @Column({ nullable: true })
  creator: string = '';

  @Column({ nullable: true })
  royalties: number = 0;

  @Column({ nullable: true })
  hash: string = '';

  @Column('text', {
    nullable: true, transformer: {
      to: (value: string[]): string => JSON.stringify(value),
      from: (value: string): string[] => JSON.parse(value),
    },
  })
  uris?: string[] = [];

  @Column('text', { nullable: true, array: true })
  tags?: string[] = [];

  @Column({ nullable: true })
  attributes: string = '';

  @Column({ nullable: true, name: 'meta_data' })
  metaData: string = '';

  @Column({ nullable: true, name: 'non_empty_uris' })
  nonEmptyUris: boolean = false;

  @Column({ nullable: true, name: 'white_listed_storage' })
  whiteListedStorage: boolean = false;

  @Column({ nullable: true })
  address: string = '';

  @Column({ nullable: true, name: 'token_name' })
  tokenName: string = '';

  @Column({ nullable: true, name: 'token_nonce' })
  tokenNonce: number = 0;
}
