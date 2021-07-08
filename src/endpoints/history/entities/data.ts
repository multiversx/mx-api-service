import { ApiProperty } from "@nestjs/swagger";

export class Data {
  @ApiProperty()
  time: string = '';

  @ApiProperty()
  value: number = 0;
}