import { ApiProperty } from "@nestjs/swagger";

export class ExploreCollectionsStats {
  constructor(init?: Partial<ExploreCollectionsStats>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Number })
  activeLast30DaysCount: number = 0;

  @ApiProperty({ type: Number })
  verifiedCount: number = 0;
}
