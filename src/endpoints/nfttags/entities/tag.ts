import { ApiProperty } from "@nestjs/swagger";

export class Tag {
  @ApiProperty({ type: String, nullable: true })
  tag: string | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  count: number | undefined = undefined;
}
