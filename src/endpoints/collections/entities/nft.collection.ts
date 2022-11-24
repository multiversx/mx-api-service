import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { NftType } from "../../nfts/entities/nft.type";
import { ScamInfo } from "src/common/entities/scam-info.dto";
import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { Account } from "src/endpoints/accounts/entities/account";
import { CollectionTrait } from "./collection.trait";

@ObjectType("NftCollection", { description: "NFT collection object type." })
export class NftCollection {
  constructor(init?: Partial<NftCollection>) {
    Object.assign(this, init);
  }

  @Field(() => ID, { description: 'Collection identifier for the given NFT collection.' })
  @ApiProperty({ type: String })
  collection: string = '';

  @Field(() => NftType, { description: 'NFT type for the given NFT collection.' })
  @ApiProperty({ enum: NftType })
  type: NftType = NftType.NonFungibleESDT;

  @Field(() => String, { description: 'Name for the given NFT collection.' })
  @ApiProperty({ type: String })
  name: string = '';

  @Field(() => ID, { description: 'Ticker for the given NFT collection.' })
  @ApiProperty({ type: String })
  ticker: string = '';

  @Field(() => Account, { description: 'Owner for the given NFT collection.', nullable: true })
  @ApiProperty({ type: String, nullable: true })
  owner: string | undefined = undefined;

  @Field(() => Float, { description: 'Timestamp for the given NFT collection.' })
  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @Field(() => Boolean, { description: 'If the given NFT collection can freeze.', nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canFreeze: boolean = false;

  @Field(() => Boolean, { description: 'If the given NFT collection can wipe.', nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canWipe: boolean = false;

  @Field(() => Boolean, { description: 'If the given NFT collection can pause.', nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canPause: boolean = false;

  @Field(() => Boolean, { description: 'If the given NFT collection can transfer NFT create role.', nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canTransferNftCreateRole: boolean = false;

  @Field(() => Boolean, { description: 'If the given NFT collection can change owner.', nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canChangeOwner: boolean = false;

  @Field(() => Boolean, { description: 'If the given NFT collection can upgrade.', nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canUpgrade: boolean = false;

  @Field(() => Boolean, { description: 'If the given NFT collection can add special role.', nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canAddSpecialRoles: boolean = false;

  @Field(() => Float, { description: 'Decimals for the given NFT collection.', nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  decimals: number | undefined = undefined;

  @Field(() => TokenAssets, { description: 'Assets for the given NFT collection.', nullable: true })
  @ApiProperty({ type: TokenAssets, nullable: true })
  assets: TokenAssets | undefined = undefined;

  @Field(() => ScamInfo, { description: 'Scam information for the underlying collection.', nullable: true })
  @ApiProperty({ type: ScamInfo, nullable: true })
  scamInfo: ScamInfo | undefined = undefined;

  @Field(() => [CollectionTrait], { description: 'Trait list for the given NFT collection.', nullable: true })
  @ApiProperty({ type: CollectionTrait, isArray: true })
  traits: CollectionTrait[] = [];
}
