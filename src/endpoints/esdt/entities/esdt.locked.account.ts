import { ApiProperty } from "@nestjs/swagger";

export class EsdtLockedAccount {
  constructor(init?: Partial<EsdtLockedAccount>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  address: string = '';

  @ApiProperty({ type: String, nullable: true })
  name: string | undefined = undefined;

  @ApiProperty({ type: String })
  balance: string | number = '';
}
