import { ApiProperty } from "@nestjs/swagger";

export class Stake {
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
