import { ApiProperty } from "@nestjs/swagger";

export class NftOwner {
  constructor(init?: Partial<NftOwner>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @ApiProperty({ type: String, default: '1' })
  balance: string = '';
}
