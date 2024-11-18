import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";

export class TokenSupplyOptions {
  constructor(init?: Partial<TokenSupplyOptions>) {
    Object.assign(this, init);
  }

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Supply amount' }))
  denominated?: boolean;
}
