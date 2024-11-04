import { ApiProperty } from "@nestjs/swagger";
export class NftRank {
  
  constructor(init?: Partial<NftRank>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: Number })
  rank: number = 0;
}
