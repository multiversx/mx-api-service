import { ApiProperty } from '@nestjs/swagger';
import { AccountAssets } from '../../../common/assets/entities/account.assets';

export class Application {
  constructor(init?: Partial<Application>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  contract: string = '';

  @ApiProperty({ type: String })
  deployer: string = '';

  @ApiProperty({ type: String })
  owner: string = '';

  @ApiProperty({ type: String })
  codeHash: string = '';

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: Boolean, required: false, description: 'Is the application verified' })
  isVerified?: boolean;

  @ApiProperty({ type: AccountAssets, nullable: true, description: 'Contract assets' })
  assets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: String })
  balance: string = '0';

  @ApiProperty({ type: String })
  developerRewards: string = '0';

  @ApiProperty({ type: Number, required: false })
  txCount?: number;

  @ApiProperty({ type: Number, required: false, nullable: true, description: 'Number of unique users in the last 24 hours' })
  users24h?: number | null;

  @ApiProperty({ type: String, required: false, nullable: true, description: 'Total fees captured in the last 24 hours' })
  feesCaptured24h?: string | null;
}
