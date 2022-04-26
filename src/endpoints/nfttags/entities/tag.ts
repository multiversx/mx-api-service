import { ApiProperty } from "@nestjs/swagger";

export class Tag {
  @ApiProperty({ type: String })
  tag: string | undefined = undefined;

  @ApiProperty({ type: Number })
  count: number | undefined = undefined;
}
