import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { ProviderUnstakedTokens } from "./provider.unstaked.tokens";

export class ProviderStake {
  constructor(init?: Partial<ProviderStake>) {
    Object.assign(this, init);
  }

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalStaked: string = '';

  @ApiProperty({ type: ProviderUnstakedTokens, isArray: true, nullable: true, required: false })
  unstakedTokens: ProviderUnstakedTokens[] | undefined = undefined;
}
