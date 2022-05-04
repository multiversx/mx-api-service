import { ApiProperty } from "@nestjs/swagger";

export class EsdtLockedAccount {
  @ApiProperty()
  address: string = '';

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  balance: string = '';
}
