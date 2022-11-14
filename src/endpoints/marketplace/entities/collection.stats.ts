import { ApiProperty } from "@nestjs/swagger";

export class CollectionStats {
  constructor(init?: Partial<CollectionStats>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  activeAuctions: string = '';

  @ApiProperty({ type: String })
  auctionsEnded: string = '';

  @ApiProperty({ type: String })
  maxPrice: string = '';

  @ApiProperty({ type: String })
  minPrice: string = '';

  @ApiProperty({ type: String })
  saleAverage: string = '';

  @ApiProperty({ type: String })
  volumeTraded: string = '';

  @ApiProperty({ type: Number })
  items: number = 0;
}
