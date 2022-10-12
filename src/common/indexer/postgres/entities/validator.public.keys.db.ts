import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('validator_public_keys')
export class ValidatorPublicKeysDb {
  @PrimaryColumn()
  id: string = '';

  @Column('text', { nullable: true, name: 'pub_keys', array: true })
  pubKeys: string[] = [];
}
