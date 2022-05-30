import { ApiProperty } from "@nestjs/swagger";
import { NftCollection } from "./nft.collection";

export class NftCollectionAccount extends NftCollection {
  @ApiProperty()
  count: number = 0;
}
