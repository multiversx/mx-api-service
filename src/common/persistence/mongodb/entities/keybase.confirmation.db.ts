import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity('keybase_confirmations')
@Index(['identity'], { unique: true })
export class KeybaseConfirmationDb {
  // dummy
  @ObjectIdColumn()
  identifier?: string;

  @Column()
  identity: string = '';

  @Column()
  keys: string[] = [];
}
