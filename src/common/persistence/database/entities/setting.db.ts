import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('settings')
export class SettingDb {
  @PrimaryColumn()
  id?: string;

  @Column('json')
  value?: any;
}
