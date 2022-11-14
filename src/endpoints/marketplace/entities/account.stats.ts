import { ApiProperty } from "@nestjs/swagger";

export class AccountStats {
  constructor(init?: Partial<AccountStats>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @ApiProperty({ type: String })
  auctions: string = '';

  @ApiProperty({ type: String })
  claimable: string = '';

  @ApiProperty({ type: String })
  collected: string = '';

  @ApiProperty({ type: String })
  collections: string = '';

  @ApiProperty({ type: String })
  creations: string = '';

  @ApiProperty({ type: String })
  likes: string = '';

  @ApiProperty({ type: String })
  marketplaceKey: string = '';

  @ApiProperty({ type: String })
  orders: string = '';
}
