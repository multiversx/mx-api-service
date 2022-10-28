import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity('swappableSetting')
export class SwappableSettingsDb {
  @ObjectIdColumn()
  id!: string;

  @Column()
  key: string = '';

  @Column()
  value: boolean = false;
}
