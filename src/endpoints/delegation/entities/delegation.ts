import { ApiProperty } from "@nestjs/swagger";
import { SwaggerUtils } from "src/utils/swagger.utils";

export class Delegation {
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  stake: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  topUp: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  locked: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  minDelegation: string = '';
}
