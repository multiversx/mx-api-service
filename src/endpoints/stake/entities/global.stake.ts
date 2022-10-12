import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("GlobalStake", { description: "GlobalStake object type." })
export class GlobalStake {
  constructor(init?: Partial<GlobalStake>) {
    Object.assign(this, init);
  }

  @Field(() => Float, { description: "Total validators." })
  @ApiProperty({ type: Number, default: 3200 })
  totalValidators: number = 0;

  @Field(() => Float, { description: "Active validators." })
  @ApiProperty({ type: Number, default: 3199 })
  activeValidators: number = 0;

  @Field(() => Float, { description: "Validators queue size." })
  @ApiProperty({ type: Number, default: 2 })
  queueSize: number = 0;

  @Field(() => Float, { description: "Total stake amount." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalStaked: number = 0;
}
