import { ApiProperty } from "@nestjs/swagger";

export class AccountKey {
  @ApiProperty()
  blsKey: string = '';

  @ApiProperty()
  stake: string = '';

  @ApiProperty()
  status: string = '';

  @ApiProperty()
  rewardAddress: string = '';
}