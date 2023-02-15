import { ApiProperty } from "@nestjs/swagger";
import { AuctionStatus } from "./auction.status";

export class Auction {
  constructor(init?: Partial<Auction>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  creator?: string = '';

  @ApiProperty({ type: String })
  owner?: string = '';

  @ApiProperty({ type: String })
  auctionId?: string = '';

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

  @ApiProperty({ type: String })
  marketplaceAuctionId: string = '';

  @ApiProperty({ type: String })
  marketplace: string = '';

  @ApiProperty({ type: [String] })
  tags: string[] = [];
}
