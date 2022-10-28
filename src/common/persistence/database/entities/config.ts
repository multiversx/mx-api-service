import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('swappableConfig')
export class SwappableSettingsDb {
  @PrimaryColumn()
  id!: string;

  @Column()
  key: string = '';

  @Column()
  value: boolean = false;
}
