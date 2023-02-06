import { ApiProperty } from "@nestjs/swagger";

export class AccountStats {
  constructor(init?: Partial<AccountStats>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Number })
  auctions: number = 0;

  @ApiProperty({ type: Number })
  claimable: number = 0;

  @ApiProperty({ type: Number })
  collected: number = 0;

  @ApiProperty({ type: Number })
  collections: number = 0;

  @ApiProperty({ type: Number })
  creations: number = 0;

  @ApiProperty({ type: Number })
  likes: number = 0;

  @ApiProperty({ type: Number })
  marketplaceKey: string = '';

  @ApiProperty({ type: Number })
  orders: number = 0;
}
