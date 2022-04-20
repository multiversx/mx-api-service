import { ApiProperty } from "@nestjs/swagger";
import { TokenDetailed } from "./token.detailed";

export class TokenWithBalance extends TokenDetailed {
  @ApiProperty()
  balance: string = '';
}
