import { ApiProperty } from "@nestjs/swagger";

export class NftRarity {
  constructor(init?: Partial<NftRarity>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Number })
  rank: number = 0;

  @ApiProperty({ type: Number })
  score: number = 0;
}
