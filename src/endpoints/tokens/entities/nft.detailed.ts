import { ApiProperty } from "@nestjs/swagger";
import { Nft } from "./nft";
import { NftOwner } from "./nft.owner";

export class NftDetailed extends Nft {
  @ApiProperty()
  owner: string = '';

  @ApiProperty()
  owners: NftOwner[] = [];
}