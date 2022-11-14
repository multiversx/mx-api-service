import { ApiProperty } from "@nestjs/swagger";

export class ExploreNftsStats {
  constructor(init?: Partial<ExploreNftsStats>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Number })
  buyNowCount: number = 0;

  @ApiProperty({ type: Number })
  liveAuctionsCount: number = 0;
}
