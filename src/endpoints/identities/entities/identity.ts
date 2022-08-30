import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("Identity", { description: "Identity object type." })
export class Identity {
  constructor(init?: Partial<Identity>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Identity provider." })
  @ApiProperty({ type: String })
  identity?: string = '';

  @Field(() => String, { description: "Provider name details." })
  @ApiProperty({ type: String })
  name?: string;

  @Field(() => String, { description: "Provider description details." })
  @ApiProperty({ type: String })
  description?: string;

  @Field(() => String, { description: "Provider avatar." })
  @ApiProperty({ type: String })
  avatar?: string;

  @Field(() => String, { description: "Provider website details." })
  @ApiProperty({ type: String })
  website?: string;

  @Field(() => String, { description: "Provider twitter account." })
  @ApiProperty({ type: String })
  twitter?: string;

  @Field(() => String, { description: "Provider location details." })
  @ApiProperty({ type: String })
  location?: string;

  @Field(() => Float, { description: "Provider score details." })
  @ApiProperty({ type: Number })
  score?: number;

  @Field(() => Float, { description: "Provider validators details." })
  @ApiProperty({ type: Number })
  validators?: number;

  @Field(() => String, { description: "Provider stake details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  stake?: string;

  @Field(() => String, { description: "Provider topUp amount details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  topUp?: string;

  @Field(() => String, { description: "Provider locked ESDT details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  locked: string = '';

  @Field(() => Number, { description: "Provider distribution details." })
  @ApiProperty()
  distribution?: { [index: string]: number } = {};

  @Field(() => [String], { description: "Providers details." })
  @ApiProperty({ type: [String] })
  providers?: string[];

  @Field(() => Float, { description: "Provider stake percent details" })
  @ApiProperty({ type: Number })
  stakePercent?: number;

  @Field(() => Float, { description: "Provider rank details." })
  @ApiProperty({ type: Number })
  rank?: number;

  @Field(() => Float, { description: "Provider apr details." })
  @ApiProperty({ type: Number })
  apr?: number;
}
