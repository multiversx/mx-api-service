import { ApiProperty } from "@nestjs/swagger";

export class WaitingList {
  @ApiProperty({ type: String })
  address: string = '';

  @ApiProperty({ type: Number })
  nonce: number = 0;

  @ApiProperty({ type: Number })
  rank: number = 0;

  @ApiProperty({ type: String, default: 0 })
  value: string = '';
}
