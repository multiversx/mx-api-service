import { ApiProperty } from "@nestjs/swagger";

export class ExploreNftsStats {
  constructor(init?: Partial<ExploreNftsStats>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  buyNowCount: number = 0;

  @ApiProperty({ type: String })
  liveAuctionsCount: number = 0;
}
