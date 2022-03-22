import { ApiProperty } from "@nestjs/swagger";
import { NftAccount } from "src/endpoints/nfts/entities/nft.account";
import { NftCollection } from "./nft.collection";

export class NftCollectionAccount extends NftCollection {

  @ApiProperty()
  nfts?: NftAccount[];

  @ApiProperty()
  nftCount?: number;
}
