import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity('keybase_confirmation')
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
