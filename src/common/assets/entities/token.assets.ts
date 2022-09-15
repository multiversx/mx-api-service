import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

import GraphQLJSON from "graphql-type-json";

import { TokenAssetStatus } from "../../../endpoints/tokens/entities/token.asset.status";

@ObjectType("TokenAssets", { description: "Token assets object type." })
export class TokenAssets {
  @Field(() => String, { description: 'Website for the given token assets.' })
  @ApiProperty({ type: String })
  website: string = '';

  @Field(() => String, { description: 'Description for the given token assets.' })
  @ApiProperty({ type: String })
  description: string = '';

  @Field(() => String, { description: 'Status for the given token assets.' })
  @ApiProperty({ enum: TokenAssetStatus, default: 'inactive' })
  status: TokenAssetStatus = TokenAssetStatus.inactive;

  @Field(() => String, { description: 'PNG URL for the given token assets.' })
  @ApiProperty({ type: String })
  pngUrl: string = '';

  @Field(() => String, { description: 'SVG URL for the given token assets.' })
  @ApiProperty({ type: String })
  svgUrl: string = '';

  @Field(() => String, { description: 'Ledger signature for the given token assets.', nullable: true })
  @ApiProperty({ type: String })
  ledgerSignature: string | undefined;

  @Field(() => GraphQLJSON, { description: 'Locked accounts for the given token assets.', nullable: true })
  @ApiProperty({ type: String })
  lockedAccounts: Record<string, string> | undefined = undefined;

  @Field(() => [String], { description: 'Extra tokens for the given token assets.', nullable: true })
  @ApiProperty({ type: String, isArray: true })
  extraTokens: string[] | undefined = undefined;
}
