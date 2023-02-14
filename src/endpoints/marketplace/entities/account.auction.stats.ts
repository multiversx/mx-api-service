import { ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("AccountAuctionStats", { description: "Account auction statistics." })
export class AccountAuctionStats {
  constructor(init?: Partial<AccountAuctionStats>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Number })
  auctions: number = 0;

  @ApiProperty({ type: Number })
  claimable: number = 0;

  @ApiProperty({ type: Number })
  collected: number = 0;

  @ApiProperty({ type: Number })
  collections: number = 0;

  @ApiProperty({ type: Number })
  creations: number = 0;

  @ApiProperty({ type: Number })
  likes: number = 0;

  @ApiProperty({ type: Number })
  orders: number = 0;
}
