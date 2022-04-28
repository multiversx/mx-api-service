import { SwaggerUtils } from 'src/utils/swagger.utils';
import { ApiProperty } from "@nestjs/swagger";

export class GlobalStake {
  @ApiProperty({type: Number, default: 3200})
  totalValidators: number = 0;

  @ApiProperty({type: Number, default: 3199})
  activeValidators: number = 0;

  @ApiProperty({type: Number, default: 2})
  queueSize: number = 0;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalStaked: number = 0;
}
