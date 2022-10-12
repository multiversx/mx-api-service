import { ApiProperty } from "@nestjs/swagger";

export class Stake {
  constructor(init?: Partial<Stake>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  bls: string = '';

  @ApiProperty({ type: String })
  stake: string = '0';

  @ApiProperty({ type: String })
  topUp: string = '0';

  @ApiProperty({ type: String })
  locked: string = '0';

  @ApiProperty({ type: String })
  address: string = '';
}
