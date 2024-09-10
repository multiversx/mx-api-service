import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { TokenAssetsPriceSourceType } from "./token.assets.price.source.type";

@ObjectType("TokenAssetsPriceSource", { description: "Token assets price source object type." })
export class TokenAssetsPriceSource {
  @Field(() => String, { description: 'Type of price source', nullable: true })
  @ApiProperty({ type: TokenAssetsPriceSourceType, nullable: true })
  type: TokenAssetsPriceSourceType | undefined = undefined;

  @Field(() => String, { description: 'URL of price source in case of customUrl type', nullable: true })
  @ApiProperty({ type: String, nullable: true })
  url: string | undefined = undefined;

  @Field(() => String, { description: '(Optional) path to fetch the price info in case of customUrl type', nullable: true })
  @ApiProperty({ type: String, nullable: true })
  path: string | undefined = undefined;
}
