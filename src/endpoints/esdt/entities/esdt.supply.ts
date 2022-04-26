import { ApiProperty } from "@nestjs/swagger";

export class EsdtSupply {
  @ApiProperty()
  totalSupply: string = '0';

  @ApiProperty()
  circulatingSupply: string = '0';
}
