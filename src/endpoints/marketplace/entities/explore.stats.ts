import { ApiProperty } from "@nestjs/swagger";

export class ExploreStats {
  constructor(init?: Partial<ExploreStats>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Number })
  artists: number = 0;

  @ApiProperty({ type: Number })
  collections: number = 0;

  @ApiProperty({ type: Number })
  nfts: number = 0;
}
