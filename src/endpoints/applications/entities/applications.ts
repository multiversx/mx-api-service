import { ApiProperty } from "@nestjs/swagger";

export class Applications {
  constructor(init?: Partial<Applications>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  address: string = '';

  @ApiProperty({ type: String })
  balance: string = '';

  @ApiProperty({ type: Number })
  usersCount: number = 0;

  @ApiProperty({ type: String })
  feesCaptured: string = '';

  @ApiProperty({ type: Number })
  deployedAt: number = 0;

  @ApiProperty({ type: String })
  deployTxHash: string = '';

  @ApiProperty({ type: Boolean })
  isVerified: boolean = false;

  @ApiProperty({ type: Number })
  txCount: number = 0;

  @ApiProperty({ type: Object, required: false })
  assets?: any;

  @ApiProperty({ type: String })
  developerReward: string = '';
}
