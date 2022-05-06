import { ApiProperty } from "@nestjs/swagger";
import { TokenDetailed } from "./token.detailed";

export class TokenDetailedWithBalance extends TokenDetailed {
  @ApiProperty()
  balance: string = '';

  @ApiProperty({ type: Number, nullable: true })
  valueUsd: number | undefined = undefined;
}
