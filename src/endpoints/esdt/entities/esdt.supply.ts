import { ApiProperty } from "@nestjs/swagger";

export class EsdtSupply {
  @ApiProperty()
  totalSupply: string = '0';

  @ApiProperty()
  circulatingSupply: string = '0';

  @ApiProperty()
  minted: string = '0';

  @ApiProperty()
  burned: string = '0';

  @ApiProperty()
  initialMinted: string = '0';
}
