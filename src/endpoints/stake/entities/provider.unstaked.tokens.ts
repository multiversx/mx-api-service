import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";

export class ProviderUnstakedTokens {
  constructor(init?: Partial<ProviderUnstakedTokens>) {
    Object.assign(this, init);
  }

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  amount: string = '';

  @ApiProperty({ type: Number, nullable: true })
  expires: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  epochs: number | undefined;
}
