import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { NftType } from "../../nfts/entities/nft.type";
import { ScamInfo } from "src/common/entities/scam-info.dto";
import { CollectionTrait } from "./collection.trait";
import { CollectionAuctionStats } from "src/endpoints/marketplace/entities/collection.auction.stats";
import { NftSubType } from "src/endpoints/nfts/entities/nft.sub.type";

export class NftCollection {
  constructor(init?: Partial<NftCollection>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  collection: string = '';

  @ApiProperty({ enum: NftType })
  type: NftType = NftType.NonFungibleESDT;

  @ApiProperty({ enum: NftSubType, nullable: true })
  subType: NftSubType | undefined = undefined;

  @ApiProperty({ type: String })
  name: string = '';

  @ApiProperty({ type: String })
  ticker: string = '';

  @ApiProperty({ type: String, nullable: true })
  owner: string | undefined = undefined;

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: Boolean, default: false })
  canFreeze: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canWipe: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canPause: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canTransferNftCreateRole: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canChangeOwner: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canUpgrade: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canAddSpecialRoles: boolean = false;

  @ApiProperty({ type: Number, nullable: true })
  decimals: number | undefined = undefined;

  @ApiProperty({ type: TokenAssets, nullable: true })
  assets: TokenAssets | undefined = undefined;

  @ApiProperty({ type: ScamInfo, nullable: true })
  scamInfo: ScamInfo | undefined = undefined;

  @ApiProperty({ type: CollectionTrait, isArray: true })
  traits: CollectionTrait[] = [];

  @ApiProperty({ type: CollectionAuctionStats, nullable: true })
  auctionStats: CollectionAuctionStats | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  isVerified: boolean | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  holderCount: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  nftCount: number | undefined = undefined;
}
