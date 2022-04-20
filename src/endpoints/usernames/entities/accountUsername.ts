import { ApiProperty } from "@nestjs/swagger";

export class AccountUsername {
  @ApiProperty({ type: String })
  address: string = '';

  @ApiProperty({ type: Number })
  nonce: number | undefined;

  @ApiProperty({ type: String })
  balance: string = '';

  @ApiProperty({ type: String })
  rootHash: string = '';

  @ApiProperty({ type: Number })
  txCount: number | undefined;

  @ApiProperty({ type: Number })
  scrCount: number | undefined;

  @ApiProperty({ type: String })
  username: string = '';

  @ApiProperty({ type: Number })
  shard: number | undefined;

  @ApiProperty({ type: String })
  developerReward: string = '';
}
