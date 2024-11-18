import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";

export class Account {
  constructor(init?: Partial<Account>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, description: 'Account bech32 address', example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Account current balance' }))
  balance: string = '';

  @ApiProperty({ type: Number, description: 'Account current nonce', example: 42 })
  nonce: number = 0;

  @ApiProperty({ type: Number, description: 'Timestamp of the block where the account was first indexed', example: 1676979360 })
  timestamp: number = 0;

  @ApiProperty({ type: Number, description: 'The shard ID allocated to the account', example: 0 })
  shard: number = 0;

  @ApiProperty({ type: String, description: 'Current owner address', required: false })
  ownerAddress: string | undefined = undefined;

  @ApiProperty({ type: AccountAssets, nullable: true, description: 'Account assets', required: false })
  assets: AccountAssets | undefined = undefined;

  @ApiProperty({ description: 'Specific property flag for smart contract', type: Number, required: false })
  deployedAt?: number | null;

  @ApiProperty({ description: 'The contract deploy transaction hash', required: false })
  deployTxHash?: string | null;

  @ApiProperty({ type: AccountAssets, nullable: true, description: 'Account assets', required: false })
  ownerAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean, required: false })
  isVerified?: boolean;

  @ApiProperty({ description: 'The number of transactions performed on this account' })
  txCount?: number;

  @ApiProperty({ description: 'The number of smart contract results of this account' })
  scrCount?: number;

  @ApiProperty({ type: Number, description: 'Transfers in the last 24 hours', required: false })
  transfersLast24h: number | undefined = undefined;
}
