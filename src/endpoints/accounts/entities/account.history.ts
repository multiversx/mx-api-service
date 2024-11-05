import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";

export class AccountHistory {
  constructor(init?: Partial<AccountHistory>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = '';

  @ApiProperty({ type: Number, example: 10000 })
  timestamp: number = 0;

  @ApiProperty({ type: Boolean, nullable: true, example: true, required: false })
  isSender?: boolean | undefined = undefined;
}
