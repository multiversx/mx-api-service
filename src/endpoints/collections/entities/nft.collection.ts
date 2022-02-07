import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "src/endpoints/tokens/entities/token.assets";
import { AddresCollectionRoles } from "./address.collection.roles";
import { NftType } from "../../nfts/entities/nft.type";

export class NftCollection {
  @ApiProperty()
  collection: string = '';

  @ApiProperty()
  type: NftType = NftType.NonFungibleESDT;

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  ticker: string = '';

  @ApiProperty()
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
  canTransferRole: boolean = false;

  @ApiProperty()
  decimals: number | undefined;

  @ApiProperty()
  assets: TokenAssets | undefined = undefined;

  @ApiProperty()
  roles: AddresCollectionRoles[] = [];
}
