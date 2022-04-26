import { ApiProperty } from "@nestjs/swagger";

export class TokenAccount {
  @ApiProperty()
  address: string = "";

  @ApiProperty()
  balance: string = "";
}
