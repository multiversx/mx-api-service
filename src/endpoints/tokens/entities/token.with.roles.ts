import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";

export class TokenWithRoles extends Token {
  @ApiProperty({ type: Boolean, default: false })
  canMint: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canBurn: boolean = false;

  @ApiProperty({ type: [String] })
  roles: string[] = [];
}
