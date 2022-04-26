import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "src/endpoints/tokens/entities/token.assets";
import { NftMedia } from "./nft.media";
import { NftMetadata } from "./nft.metadata";
import { NftType } from "./nft.type";

export class Nft {
  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  collection: string = '';

  @ApiProperty({ type: Number })
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

  @ApiProperty({ type: NftMedia })
  media: NftMedia[] | undefined = undefined;

  @ApiProperty({ type: Boolean })
  isWhitelistedStorage: boolean = false;

  @ApiProperty({ type: String })
  thumbnailUrl: string = '';

  @ApiProperty({ isArray: true })
  tags: string[] = [];

  @ApiProperty({ type: NftMetadata })
  metadata: NftMetadata | undefined = undefined;

  @ApiProperty({ type: String })
  owner: string | undefined = undefined;

  @ApiProperty({ type: String })
  balance: string | undefined = undefined;

  @ApiProperty({ type: String })
  supply: string | undefined = undefined;

  @ApiProperty({ type: Number })
  decimals: number | undefined = undefined;

  @ApiProperty()
  assets?: TokenAssets;

  @ApiProperty({ type: String })
  ticker?: string = '';

  @ApiProperty({ type: String, nullable: true })
  scamInfo: any | undefined = undefined;
}
