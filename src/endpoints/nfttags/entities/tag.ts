import { ApiProperty } from "@nestjs/swagger";

export class Tag {
  @ApiProperty({ type: String, nullable: true, example: 'RWxyb25k' })
  tag: string | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true, example: 46135 })
  count: number | undefined = undefined;
}
