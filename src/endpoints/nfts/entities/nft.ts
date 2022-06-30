import { ApiProperty } from "@nestjs/swagger";
import { ScamInfo } from "src/common/entities/scam-info.dto";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { NftMedia } from "./nft.media";
import { NftMetadata } from "./nft.metadata";
import { NftType } from "./nft.type";
import { SwaggerUtils } from "@elrondnetwork/erdnest";

export class Nft {
  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  collection: string = '';

  @ApiProperty({ type: Number, nullable: true })
  timestamp?: number = undefined;

  @ApiProperty({ type: String })
  attributes: string = '';

  @ApiProperty({ type: Number })
  nonce: number = 0;

  @ApiProperty({ enum: NftType })
  type: NftType = NftType.NonFungibleESDT;

  @ApiProperty({ type: String })
  name: string = '';

  @ApiProperty({ type: String })
  creator: string = '';

  @ApiProperty({ type: Number, nullable: true })
  royalties: number | undefined = undefined;

  @ApiProperty({ isArray: true })
  uris: string[] = [];

  @ApiProperty({ type: String })
  url: string = '';

  @ApiProperty({ type: NftMedia, nullable: true })
  media: NftMedia[] | undefined = undefined;

  @ApiProperty({ type: Boolean, default: false })
  isWhitelistedStorage: boolean = false;

  @ApiProperty({ type: String })
  thumbnailUrl: string = '';

  @ApiProperty({ isArray: true })
  tags: string[] = [];

  @ApiProperty({ type: NftMetadata, nullable: true })
  metadata: NftMetadata | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  owner: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  balance: string | undefined = undefined;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  supply: string | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  decimals: number | undefined = undefined;

  @ApiProperty()
  assets?: TokenAssets;

  @ApiProperty({ type: String })
  ticker?: string = '';

  @ApiProperty({ type: ScamInfo, nullable: true })
  scamInfo: ScamInfo | undefined = undefined;
}
