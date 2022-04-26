import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "src/endpoints/tokens/entities/token.assets";
import { NftType } from "../../nfts/entities/nft.type";
import { CollectionRoles } from "src/endpoints/tokens/entities/collection.roles";

export class NftCollection {
  @ApiProperty({ type: String })
  collection: string = '';

  @ApiProperty({ enum: NftType })
  type: NftType = NftType.NonFungibleESDT;

  @ApiProperty({ type: String })
  name: string = '';

  @ApiProperty({ type: String })
  ticker: string = '';

  @ApiProperty({ type: String })
  owner: string | undefined = undefined;

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: Boolean })
  canFreeze: boolean = false;

  @ApiProperty({ type: Boolean })
  canWipe: boolean = false;

  @ApiProperty({ type: Boolean })
  canPause: boolean = false;

  @ApiProperty({ type: Boolean })
  canTransferNftCreateRole: boolean = false;

  @ApiProperty({ type: Number })
  decimals: number | undefined = undefined;

  @ApiProperty({ type: TokenAssets })
  assets: TokenAssets | undefined = undefined;

  @ApiProperty({ type: CollectionRoles })
  roles: CollectionRoles[] = [];
}
