import { SwaggerUtils } from 'src/utils/swagger.utils';
import { ApiProperty } from "@nestjs/swagger";

export class EsdtSupply {
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalSupply: string = '0';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  circulatingSupply: string = '0';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  minted: string = '0';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  burned: string = '0';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  initialMinted: string = '0';
}
