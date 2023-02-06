import { ApiProperty } from "@nestjs/swagger";

export class CollectionStats {
  constructor(init?: Partial<CollectionStats>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: Number })
  activeAuctions?: number = 0;

  @ApiProperty({ type: Number })
  endedAuctions: number = 0;

  @ApiProperty({ type: Number })
  maxPrice: number = 0;

  @ApiProperty({ type: Number })
  minPrice: number = 0;

  @ApiProperty({ type: Number })
  saleAverage: number = 0;

  @ApiProperty({ type: Number })
  volumeTraded: number = 0;
}
