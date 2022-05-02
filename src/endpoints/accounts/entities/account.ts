import { ApiProperty } from "@nestjs/swagger";
import { SwaggerUtils } from "src/utils/swagger.utils";

export class Account {
  @ApiProperty({ type: String, description: 'Account bech32 address' })
  address: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Account current balance' }))
  balance: string = '';

  @ApiProperty({ type: Number, description: 'Account current nonce' })
  nonce: number = 0;

  @ApiProperty({ type: Number, description: 'The shard ID allocated to the account' })
  shard: number = 0;
}
