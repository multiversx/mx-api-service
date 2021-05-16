import { ApiProperty } from "@nestjs/swagger";

export class Economics {
  @ApiProperty()
  totalSupply: number = 0;

  @ApiProperty()
  circulatingSupply: number = 0;
  
  @ApiProperty()
  staked: number = 0;
}