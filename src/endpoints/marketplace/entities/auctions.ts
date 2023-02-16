import { ApiProperty } from "@nestjs/swagger";
import { AuctionStatus } from "./auction.status";
import { Bids } from "./bids";

export class Auctions {
  constructor(init?: Partial<Auctions>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  owner: string = '';

  @ApiProperty({ type: Number })
  auctionId?: number = 0;

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  collection: string = '';

  @ApiProperty({ enum: AuctionStatus })
  status: AuctionStatus = AuctionStatus.unknown;

  @ApiProperty({ type: String })
  auctionType?: string = '';

  @ApiProperty({ type: Number })
  createdAt: number = 0;

  @ApiProperty({ type: Number })
  endsAt?: number = 0;

  @ApiProperty({ type: Number })
  marketplaceAuctionId: number = 0;

  @ApiProperty({ type: String })
  marketplace: string = '';

  @ApiProperty({ type: Bids })
  minBid: Bids = new Bids();

  @ApiProperty({ type: Bids })
  maxBid: Bids = new Bids();
}
