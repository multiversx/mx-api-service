import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";

export class TokenWithBalance extends Token {
  @ApiProperty({ type: String })
  balance: string = '';
}
