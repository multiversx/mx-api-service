import { SwaggerUtils } from 'src/utils/swagger.utils';
import { ApiProperty } from "@nestjs/swagger";

export class TokenAccount {
  constructor(init?: Partial<TokenAccount>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = "";

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = "";
}
