import { ApiProperty } from "@nestjs/swagger";

export class MexTokenChart {
  constructor(init?: Partial<MexTokenChart>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  timestamp: number = 0;

  @ApiProperty()
  value: number = 0;
}
