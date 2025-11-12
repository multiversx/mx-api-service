import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";

export class GenericEsdtData {
  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = '';

  constructor(init?: Partial<GenericEsdtData>) {
    Object.assign(this, init);
  }
}