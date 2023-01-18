import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity('hot_swappable_settings')
@Index(['name'], { unique: true })
export class HotSwappableSettingDb {
  // dummy
  @ObjectIdColumn()
  identifier?: string;

  @Column()
  name: string = '';

  @Column('json')
  value?: any;
}
