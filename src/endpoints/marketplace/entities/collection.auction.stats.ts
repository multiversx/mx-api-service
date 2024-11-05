import { ApiProperty } from "@nestjs/swagger";

export class CollectionAuctionStats {
  constructor(init?: Partial<CollectionAuctionStats>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Number })
  activeAuctions: number = 0;

  @ApiProperty({ type: Number })
  endedAuctions: number = 0;

  @ApiProperty({ type: String })
  maxPrice: String = "";

  @ApiProperty({ type: String })
  minPrice: String = "";

  @ApiProperty({ type: String })
  saleAverage: String = "";

  @ApiProperty({ type: String })
  volumeTraded: String = "";
}
