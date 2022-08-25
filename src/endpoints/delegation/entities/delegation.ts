import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("Delegation", { description: "Delegation object type." })
export class Delegation {
  constructor(init?: Partial<Delegation>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Stake details.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  stake: string = '';

  @Field(() => String, { description: 'TopUp details.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  topUp: string = '';

  @Field(() => String, { description: 'Locked details.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  locked: string = '';

  @Field(() => String, { description: 'MinDelegation details.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  minDelegation: string = '';
}
