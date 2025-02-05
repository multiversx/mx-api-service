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

  @ApiProperty({ type: AccountAssets, nullable: true, description: 'Contract assets' })
  assets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: String })
  balance: string = '0';

  @ApiProperty({ type: Number, required: false })
  txCount?: number;
}
