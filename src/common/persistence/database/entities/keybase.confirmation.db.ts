import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('keybase_confirmation')
export class KeybaseConfirmationDb {
  @PrimaryColumn()
  id?: string;

  @Column({ nullable: false })
  keys: string = '';
}
