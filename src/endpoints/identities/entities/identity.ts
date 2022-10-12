import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import GraphQLJSON from "graphql-type-json";

@ObjectType("Identity", { description: "Identity object type." })
export class Identity {
  constructor(init?: Partial<Identity>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Identity provider.", nullable: true })
  @ApiProperty({ type: String })
  identity?: string = '';

  @Field(() => String, { description: "Provider name details.", nullable: true })
  @ApiProperty({ type: String })
  name?: string;

  @Field(() => String, { description: "Provider description details.", nullable: true })
  @ApiProperty({ type: String })
  description?: string;

  @Field(() => String, { description: "Provider avatar.", nullable: true })
  @ApiProperty({ type: String })
  avatar?: string;

  @Field(() => String, { description: "Provider website details.", nullable: true })
  @ApiProperty({ type: String })
  website?: string;

  @Field(() => String, { description: "Provider twitter account.", nullable: true })
  @ApiProperty({ type: String })
  twitter?: string;

  @Field(() => String, { description: "Provider location details.", nullable: true })
  @ApiProperty({ type: String })
  location?: string;

  @Field(() => Float, { description: "Provider score details.", nullable: true })
  @ApiProperty({ type: Number })
  score?: number;

  @Field(() => Float, { description: "Provider validators details.", nullable: true })
  @ApiProperty({ type: Number })
  validators?: number;

  @Field(() => String, { description: "Provider stake details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  stake?: string;

  @Field(() => String, { description: "Provider topUp amount details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  topUp?: string;

  @Field(() => String, { description: "Provider locked ESDT details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  locked: string = '';

  @Field(() => GraphQLJSON, { description: "Provider distribution details.", nullable: true })
  @ApiProperty()
  distribution?: { [index: string]: number | undefined } = {};

  @Field(() => [String], { description: "Providers details.", nullable: true })
  @ApiProperty({ type: [String] })
  providers?: string[];

  @Field(() => Float, { description: "Provider stake percent details", nullable: true })
  @ApiProperty({ type: Number })
  stakePercent?: number;

  @Field(() => Float, { description: "Provider rank details.", nullable: true })
  @ApiProperty({ type: Number })
  rank?: number;

  @Field(() => Float, { description: "Provider apr details.", nullable: true })
  @ApiProperty({ type: Number })
  apr?: number;
}
