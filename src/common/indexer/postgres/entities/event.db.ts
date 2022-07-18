import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('events')
export class EventDb {
  @PrimaryColumn()
  address: string = '';

  @Column({ nullable: true })
  identifier: string = '';

  @Column('text', {
    nullable: true, transformer: {
      to: (value: string[]): string => JSON.stringify(value),
      from: (value: string): string[] => JSON.parse(value),
    },
  })
  topics: string[] = [];

  @Column({ nullable: true })
  data: string = '';

  @Column({ nullable: true })
  order: number = 0;
}
