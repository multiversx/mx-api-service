import { ApiProperty } from "@nestjs/swagger";

export class EsdtLockedAccount {
  @ApiProperty()
  address: string = '';

  @ApiProperty({ type: String, nullable: true })
  name: string | undefined = undefined;

  @ApiProperty()
  balance: string = '';
}
