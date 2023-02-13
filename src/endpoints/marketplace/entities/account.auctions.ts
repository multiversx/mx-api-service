import { ApiProperty } from "@nestjs/swagger";
import { AuctionState } from "./auction.state";

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

  @ApiProperty({ enum: AuctionState })
  status: AuctionState = AuctionState.unknown;

  @ApiProperty({ type: Number })
  createdAt: number = 0;

  @ApiProperty({ type: Number })
  endsAt: number = 0;

  @ApiProperty({ type: String })
  marketplace: string = '';

  @ApiProperty({ type: String })
  marketplaceAuctionId: string = '';

  @ApiProperty({ type: [String] })
  tags: string[] = [];
}
