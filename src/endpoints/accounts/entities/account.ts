import { SwaggerUtils } from "@elrondnetwork/nestjs-microservice-template";
import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";

export class Account {
  @ApiProperty({ type: String, description: 'Account bech32 address', example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Account current balance' }))
  balance: string = '';

  @ApiProperty({ type: Number, description: 'Account current nonce', example: 42 })
  nonce: number = 0;

  @ApiProperty({ type: Number, description: 'The shard ID allocated to the account', example: 0 })
  shard: number = 0;

  @ApiProperty({ type: AccountAssets, nullable: true, description: 'Account assets' })
  assets: AccountAssets | undefined = undefined;
}
