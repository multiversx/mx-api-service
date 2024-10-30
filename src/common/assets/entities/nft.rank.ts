import { ApiProperty } from "@nestjs/swagger";
export class NftRank {
  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: Number })
  rank: number = 0;
}
