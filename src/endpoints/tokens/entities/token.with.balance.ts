import { SwaggerUtils } from "@elrondnetwork/erdnest-common";
import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";

export class TokenWithBalance extends Token {
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = '';

  @ApiProperty({ type: Number, nullable: true })
  valueUsd: number | undefined = undefined;
}
