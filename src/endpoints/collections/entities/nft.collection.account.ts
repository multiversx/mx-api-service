import { ApiProperty } from "@nestjs/swagger";
import { NftCollection } from "./nft.collection";

export class NftCollectionAccount extends NftCollection {
  @ApiProperty()
  canCreate: boolean | undefined = undefined;

  @ApiProperty()
  canBurn: boolean | undefined = undefined;

  @ApiProperty()
  canAddQuantity: boolean | undefined = undefined;

  @ApiProperty()
  canUpdateAttributes: boolean | undefined = undefined;

  @ApiProperty()
  canAddUri: boolean | undefined = undefined;

  @ApiProperty()
  canTransferRole: boolean | undefined = undefined;
}
