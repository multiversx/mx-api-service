import { SwaggerUtils } from "@elrondnetwork/nestjs-microservice-template";
import { ApiProperty } from "@nestjs/swagger";

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
