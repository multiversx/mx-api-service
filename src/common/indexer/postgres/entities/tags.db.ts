import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Tag } from '../../entities';

@Entity('tags')
export class TagsDb implements Tag {
  @PrimaryColumn()
  tag: string = '';

  @Column({ nullable: true })
  count: number = 0;
}
