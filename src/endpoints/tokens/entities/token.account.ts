import { SwaggerUtils } from "@elrondnetwork/nestjs-microservice-template";
import { ApiProperty } from "@nestjs/swagger";

export class TokenAccount {
  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = "";

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = "";
}
