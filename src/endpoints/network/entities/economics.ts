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
  queued: number = 0;

  @ApiProperty()
  aprPercent: number = 0;

  @ApiProperty()
  waiting: number = 0;

  @ApiProperty()
  inflation: number = 0;
}