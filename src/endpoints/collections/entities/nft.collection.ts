import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { NftType } from "../../nfts/entities/nft.type";
import { CollectionRoles } from "src/endpoints/tokens/entities/collection.roles";

export class NftCollection {
  constructor(init?: Partial<NftCollection>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  collection: string = '';

  @ApiProperty({ enum: NftType })
  type: NftType = NftType.NonFungibleESDT;

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

  @ApiProperty({ type: Number, nullable: true })
  decimals: number | undefined = undefined;

  @ApiProperty({ type: TokenAssets, nullable: true })
  assets: TokenAssets | undefined = undefined;

  @ApiProperty({ type: CollectionRoles })
  roles: CollectionRoles[] = [];
}
