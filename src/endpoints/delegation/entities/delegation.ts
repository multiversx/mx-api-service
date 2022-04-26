import { ApiProperty } from "@nestjs/swagger";

export class Delegation {
  @ApiProperty({ type: String })
  stake: string = '';

  @ApiProperty({ type: String })
  topUp: string = '';

  @ApiProperty({ type: String })
  locked: string = '';

  @ApiProperty({ type: String })
  minDelegation: string = '';
}
