import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity('settings')
@Index(['name'], { unique: true })
export class SettingDb {
  // dummy
  @ObjectIdColumn()
  identifier?: string;

  @Column()
  name: string = '';

  @Column('json')
  value?: any;
}
