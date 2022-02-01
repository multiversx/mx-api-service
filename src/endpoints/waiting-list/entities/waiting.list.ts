import { ApiProperty } from "@nestjs/swagger";

export class WaitingList {
  @ApiProperty()
  address: string = '';

  @ApiProperty()
  nonce: number = 0;

  @ApiProperty()
  rank: number = 0;

  @ApiProperty()
  value: string = '';
}
