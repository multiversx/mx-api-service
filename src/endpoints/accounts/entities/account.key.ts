
import { ApiProperty } from "@nestjs/swagger";

export class AccountKey {
  @ApiProperty({ type: String })
  blsKey: string = '';

  @ApiProperty({ type: String, default: 0 })
  stake: string = '';

  @ApiProperty({ type: String, default: 0 })
  topUp: string = '';

  @ApiProperty({ type: String })
  status: string = '';

  @ApiProperty({ type: String })
  rewardAddress: string = '';

  @ApiProperty({ type: String, nullable: true })
  queueIndex: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  queueSize: string | undefined = undefined;
}
