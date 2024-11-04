import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";
import { MexPairType } from "src/endpoints/mex/entities/mex.pair.type";

export class TokenWithBalance extends Token {
  constructor(init?: Partial<TokenWithBalance>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = '';

  @ApiProperty({ type: Number, nullable: true, required: false })
  valueUsd: number | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  attributes: string | undefined = undefined;

  @ApiProperty({ enum: MexPairType })
  mexPairType: MexPairType = MexPairType.experimental;
}
