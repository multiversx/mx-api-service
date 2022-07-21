import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { NftType } from "../../nfts/entities/nft.type";
import { CollectionRoles } from "src/endpoints/tokens/entities/collection.roles";
import { Field, Float, ID, ObjectType } from "@nestjs/graphql";

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

  @Field(() => String, { description: 'Owner for the given NFT collection.', nullable: true })
  @ApiProperty({ type: String, nullable: true })
  owner: string | undefined = undefined;

  @Field(() => Float, { description: 'Timestamp for the given NFT collection.' })
  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @Field(() => Boolean, { description: 'Can freeze for the given NFT collection.', nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canFreeze: boolean = false;

  @Field(() => Boolean, { description: 'Can wipe for the given NFT collection.', nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canWipe: boolean = false;

  @Field(() => Boolean, { description: 'Can pause for the given NFT collection.', nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canPause: boolean = false;

  @Field(() => Boolean, { description: 'Can transfer NFT create role for the given NFT collection.', nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canTransferNftCreateRole: boolean = false;

  @Field(() => Float, { description: 'Decimals for the given NFT collection.', nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  decimals: number | undefined = undefined;

  @Field(() => TokenAssets, { description: 'Assets for the given NFT collection.', nullable: true })
  @ApiProperty({ type: TokenAssets, nullable: true })
  assets: TokenAssets | undefined = undefined;

  @Field(() => [CollectionRoles], { description: 'Roles for the given NFT collection.', nullable: true })
  @ApiProperty({ type: CollectionRoles })
  roles: CollectionRoles[] = [];
}
