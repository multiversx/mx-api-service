import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("ProviderUnstakedTokens", { description: "Provider unstaked tokens object type." })
export class ProviderUnstakedTokens {
  constructor(init?: Partial<ProviderUnstakedTokens>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Amount for the given token.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  amount: string = '';

  @Field(() => String, { description: 'Expires details for the given token.', nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  expires: number | undefined = undefined;

  @Field(() => String, { description: 'Epoch number for the given token.', nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  epochs: number | undefined;
}
