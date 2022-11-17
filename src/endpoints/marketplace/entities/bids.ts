import { ApiProperty } from "@nestjs/swagger";

export class Bids {
  constructor(init?: Partial<Bids>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  amount?: string = '';

  @ApiProperty({ type: String })
  token?: string = '';
}
