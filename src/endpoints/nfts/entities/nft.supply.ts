import { ApiProperty } from '@nestjs/swagger';
export class NftSupply {
  constructor(init?: Partial<NftSupply>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, default: '1' })
  supply: string = '0';
}
