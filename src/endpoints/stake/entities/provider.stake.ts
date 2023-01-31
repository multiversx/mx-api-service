import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { ProviderUnstakedTokens } from "./provider.unstaked.tokens";

@ObjectType("ProviderStake", { description: "Provider stake object type." })
export class ProviderStake {
  constructor(init?: Partial<ProviderStake>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Total stake for the given account.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalStaked: string = '';

  @Field(() => [ProviderUnstakedTokens], { description: 'Unstaked tokens details for the given account.', nullable: true })
  @ApiProperty({ type: ProviderUnstakedTokens, isArray: true, nullable: true })
  unstakedTokens: ProviderUnstakedTokens[] | undefined = undefined;
}
