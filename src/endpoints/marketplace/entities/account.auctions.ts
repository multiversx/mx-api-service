import { ApiProperty } from "@nestjs/swagger";

export class Auction {
  constructor(init?: Partial<Auction>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  auctionId: string = '';

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  collection: string = '';

  @ApiProperty({ type: String })
  status: string = '';

  @ApiProperty({ type: Number })
  creationDate: number = 0;

  @ApiProperty({ type: Number })
  endDate: number = 0;

  @ApiProperty({ type: String })
  marketplace: string = '';

  @ApiProperty({ type: String })
  marketplaceAuctionId: string = '';

  @ApiProperty({ type: String })
  owner: string = '';

  @ApiProperty({ type: String })
  tags: string[] = [];
}
