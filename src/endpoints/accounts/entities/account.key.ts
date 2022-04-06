
import { ApiProperty } from "@nestjs/swagger";

export class AccountKey {
  @ApiProperty()
  blsKey: string = '';

  @ApiProperty()
  stake: string = '';

  @ApiProperty()
  topUp: string = '';

  @ApiProperty()
  status: string = '';

  @ApiProperty()
  rewardAddress: string = '';

  @ApiProperty()
  queueIndex: string | undefined = undefined;

  @ApiProperty()
  queueSize: string | undefined = undefined;
}
