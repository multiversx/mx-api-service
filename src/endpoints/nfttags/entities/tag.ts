import { ApiProperty } from "@nestjs/swagger";

export class Tag {
  constructor(init?: Partial<Tag>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, nullable: true, example: 'sunny' })
  tag: string = '';

  @ApiProperty({ type: Number, nullable: true, example: 46135 })
  count: number | undefined = undefined;
}
