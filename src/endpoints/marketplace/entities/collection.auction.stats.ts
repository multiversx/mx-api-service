import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("CollectionAuctionStats", { description: "Collection auction statistics." })
export class CollectionAuctionStats {
  constructor(init?: Partial<CollectionAuctionStats>) {
    Object.assign(this, init);
  }

  @Field(() => Number, { description: 'Number of active auctions.', nullable: true })
  @ApiProperty({ type: Number })
  activeAuctions: number = 0;

  @Field(() => Number, { description: 'Number of ended auctions.', nullable: true })
  @ApiProperty({ type: Number })
  endedAuctions: number = 0;

  @Field(() => String, { description: 'Maximum price in EGLD.', nullable: true })
  @ApiProperty({ type: String })
  maxPrice: String = "";

  @Field(() => String, { description: 'Minimum (floor) price in EGLD.', nullable: true })
  @ApiProperty({ type: String })
  minPrice: String = "";

  @Field(() => String, { description: 'Ended auction average price in EGLD.', nullable: true })
  @ApiProperty({ type: String })
  saleAverage: String = "";

  @Field(() => String, { description: 'Total traded volume in EGLD.', nullable: true })
  @ApiProperty({ type: String })
  volumeTraded: String = "";
}
