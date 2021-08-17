import { ApiProperty } from "@nestjs/swagger";

export class Economics {
  @ApiProperty()
  totalSupply: number = 0;

  @ApiProperty()
  circulatingSupply: number = 0;
  
  @ApiProperty()
  staked: number = 0;

  @ApiProperty()
  price: number | undefined = undefined;

  @ApiProperty()
  marketCap: number | undefined = undefined;

  @ApiProperty()
  aprPercent: number = 0;

  @ApiProperty()
  topUpApr: number = 0;

  @ApiProperty()
  baseApr: number = 0;
}