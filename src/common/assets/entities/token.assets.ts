import { ApiProperty } from "@nestjs/swagger";
import { TokenAssetStatus } from "../../../endpoints/tokens/entities/token.asset.status";
import { NftRankAlgorithm } from "./nft.rank.algorithm";
import { TokenAssetsPriceSource } from "./token.assets.price.source";

export class TokenAssets {
  constructor(init?: Partial<TokenAssets>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  website: string = '';

  @ApiProperty({ type: String })
  description: string = '';

  @ApiProperty({ enum: TokenAssetStatus, default: 'inactive' })
  status: TokenAssetStatus = TokenAssetStatus.inactive;

  @ApiProperty({ type: String })
  pngUrl: string = '';

  @ApiProperty({ type: String })
  name: string = '';

  @ApiProperty({ type: String })
  svgUrl: string = '';

  @ApiProperty({ type: String })
  ledgerSignature: string | undefined;

  @ApiProperty({ type: String })
  lockedAccounts: Record<string, string> | undefined = undefined;

  @ApiProperty({ type: String, isArray: true })
  extraTokens: string[] | undefined = undefined;

  @ApiProperty({ enum: NftRankAlgorithm, nullable: true })
  preferredRankAlgorithm: NftRankAlgorithm | undefined = undefined;

  @ApiProperty({ enum: TokenAssetsPriceSource, nullable: true })
  priceSource: TokenAssetsPriceSource | undefined = undefined;
}
