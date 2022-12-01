import { ApiProperty } from "@nestjs/swagger";
import { TokenDetailed } from "./token.detailed";

export class TokenDetailedWithBalance extends TokenDetailed {
  constructor(init?: Partial<TokenDetailedWithBalance>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty()
  balance: string = '';

  @ApiProperty({ type: Number, nullable: true })
  valueUsd: number | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  attributes: string | undefined = undefined;
}
