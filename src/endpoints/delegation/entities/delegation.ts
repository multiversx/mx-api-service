import { ApiProperty } from "@nestjs/swagger";

export class Delegation {
  @ApiProperty({ type: String, default: 0 })
  stake: string = '';

  @ApiProperty({ type: String, default: 0 })
  topUp: string = '';

  @ApiProperty({ type: String, default: 0 })
  locked: string = '';

  @ApiProperty({ type: String, default: 0 })
  minDelegation: string = '';
}
