import { ApiProperty } from "@nestjs/swagger";
import { TokenAssetsPriceSourceType } from "./token.assets.price.source.type";

export class TokenAssetsPriceSource {
  @ApiProperty({ type: TokenAssetsPriceSourceType, nullable: true })
  type: TokenAssetsPriceSourceType | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  url: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  path: string | undefined = undefined;
}
