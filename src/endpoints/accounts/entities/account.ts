import { ApiProperty } from "@nestjs/swagger";
import { SwaggerUtils } from "src/utils/swagger.utils";

export class Account {
  @ApiProperty({ type: String, description: 'Account bech32 address', example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Account current balance' }))
  balance: string = '';

  @ApiProperty({ type: Number, description: 'Account current nonce', example: 42 })
  nonce: number = 0;

  @ApiProperty({ type: Number, description: 'The shard ID allocated to the account', example: 0 })
  shard: number = 0;
}
