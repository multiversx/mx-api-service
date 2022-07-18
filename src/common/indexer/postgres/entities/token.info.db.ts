import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('token_infos')
export class TokenInfoDb {
  @Column({ nullable: true })
  name: string = '';

  @Column({ nullable: true })
  ticker: string = '';

  @Column({ nullable: true })
  identifier: string = '';

  @PrimaryColumn()
  token: string = '';

  @Column({ nullable: true })
  issuer: string = '';

  @Column({ nullable: true, name: 'current_owner' })
  currentOwner: string = '';

  @Column({ nullable: true })
  type: string = '';

  @Column({ nullable: true })
  nonce: number = 0;

  @Column({ nullable: true })
  timestamp: number = 0;

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
  uris: string[] = [];

  @Column('text', {
    nullable: true, transformer: {
      to: (value: string[]): string => JSON.stringify(value),
      from: (value: string): string[] => JSON.parse(value),
    },
  })
  tags: string[] = [];

  @Column({ nullable: true })
  attributes: string = '';

  @Column({ nullable: true, name: 'meta_data' })
  meta_data: string = '';

  @Column({ nullable: true, name: 'non_empty_uris' })
  nonEmptyUris: boolean = false;

  @Column({ nullable: true, name: 'white_listed_storage' })
  whiteListedStorage: boolean = false;
}
