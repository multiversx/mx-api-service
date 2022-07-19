import { TypeormUtils } from "src/utils/typeorm.utils";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('events')
export class EventDb {
  @PrimaryColumn()
  address: string = '';

  @Column({ nullable: true })
  identifier: string = '';

  @Column('text', { nullable: true, transformer: TypeormUtils.textToStringArrayTransformer })
  topics: string[] = [];

  @Column({ nullable: true })
  data: string = '';

  @Column({ nullable: true })
  order: number = 0;
}
