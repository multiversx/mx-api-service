import { ApiProperty } from "@nestjs/swagger";
import { NftCollection } from "./nft.collection";

export class NftCollectionAccount extends NftCollection {
  @ApiProperty()
  canCreate: boolean = false;

  @ApiProperty()
  canBurn: boolean = false;

  @ApiProperty()
  canAddQuantity?: boolean;
}