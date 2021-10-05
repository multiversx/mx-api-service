import { ApiProperty } from "@nestjs/swagger";
import { Nft } from "./nft";
import { NftOwner } from "./nft.owner";

export class NftDetailed extends Nft {
  @ApiProperty()
  owners: NftOwner[] = [];
}