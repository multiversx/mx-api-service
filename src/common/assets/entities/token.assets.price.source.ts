import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { TokenAssetsPriceSourceType } from "./token.assets.price.source.type";

@ObjectType("TokenAssetsPriceSource", { description: "Token assets price source object type." })
export class TokenAssetsPriceSource {
  @Field(() => String, { description: 'Type of price source', nullable: true })
  @ApiProperty({ type: TokenAssetsPriceSourceType, nullable: true })
  type: TokenAssetsPriceSourceType | undefined = undefined;
}
