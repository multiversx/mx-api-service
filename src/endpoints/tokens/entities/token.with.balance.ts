import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";
import { MexPairType } from "src/endpoints/mex/entities/mex.pair.type";

@ObjectType("TokenWithBalance", { description: "NFT collection account object type." })
export class TokenWithBalance extends Token {
  constructor(init?: Partial<TokenWithBalance>) {
    super();
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Balance for the given token account.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = '';

  @Field(() => Float, { description: 'ValueUsd token for the given token account.', nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  valueUsd: number | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  attributes: string | undefined = undefined;

  @Field(() => MexPairType, { description: "Mex pair type details." })
  @ApiProperty({ enum: MexPairType })
  mexPairType: MexPairType = MexPairType.experimental;
}
