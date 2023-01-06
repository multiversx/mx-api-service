import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";

export class TokenWithBalance extends Token {
  constructor(init?: Partial<TokenWithBalance>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = '';

  @ApiProperty({ type: Number, nullable: true })
  valueUsd: number | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  attributes: string | undefined = undefined;
}
