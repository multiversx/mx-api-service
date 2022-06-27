import { SwaggerUtils } from "@elrondnetwork/nestjs-microservice-common";
import { ApiProperty } from "@nestjs/swagger";

export class WaitingList {
  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @ApiProperty({ type: Number, example: 46 })
  nonce: number = 0;

  @ApiProperty({ type: Number, example: 2 })
  rank: number = 0;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  value: string = '';
}
