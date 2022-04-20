import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "src/endpoints/tokens/entities/token.assets";
import { NftType } from "../../nfts/entities/nft.type";
import { CollectionRoles } from "src/endpoints/tokens/entities/collection.roles";

export class NftCollection {
  @ApiProperty()
  collection: string = '';

  @ApiProperty()
  type: NftType = NftType.NonFungibleESDT;

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  ticker: string = '';

  @ApiProperty({ type: String })
  owner: string | undefined = undefined;

  @ApiProperty()
  timestamp: number = 0;

  @ApiProperty()
  canFreeze: boolean = false;

  @ApiProperty()
  canWipe: boolean = false;

  @ApiProperty()
  canPause: boolean = false;

  @ApiProperty()
  canTransferNftCreateRole: boolean = false;

  @ApiProperty({ type: Number })
  decimals: number | undefined = undefined;

  @ApiProperty({ type: TokenAssets })
  assets: TokenAssets | undefined = undefined;

  @ApiProperty({ type: CollectionRoles })
  roles: CollectionRoles[] = [];
}
