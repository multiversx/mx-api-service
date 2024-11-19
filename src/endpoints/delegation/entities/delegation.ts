import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";

export class Delegation {
  constructor(init?: Partial<Delegation>) {
    Object.assign(this, init);
  }

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  stake: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  topUp: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  locked: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  minDelegation: string = '';
}
