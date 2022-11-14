import { ApiProperty } from "@nestjs/swagger";

export class CollectionStatsFilters {
  constructor(init?: Partial<CollectionStatsFilters>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  marketplaceKey?: string = '';

  @ApiProperty({ type: String })
  paymentToken?: string = '';
}
