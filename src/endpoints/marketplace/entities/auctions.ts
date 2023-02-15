import { ApiProperty } from "@nestjs/swagger";
import { Bids } from "./bids";

export class Auctions {
  constructor(init?: Partial<Auctions>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  owner: string = '';

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  collection: string = '';

  @ApiProperty({ type: Number })
  nonce: number = 0;

  @ApiProperty({ type: String })
  id: string = '';

  @ApiProperty({ type: Number })
  marketPlaceId: number = 0;

  @ApiProperty({ type: String })
  marketplace: string = '';

  @ApiProperty({ type: Number })
  createdAt: number = 0;

  @ApiProperty({ type: Bids })
  minBid: Bids = new Bids();

  @ApiProperty({ type: Bids })
  maxBid: Bids = new Bids();
}
