import { ApiProperty } from "@nestjs/swagger";
import { NftCollection } from "./nft.collection";

export class NftCollectionAccount extends NftCollection {
  @ApiProperty({ type: Boolean })
  canCreate: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean })
  canBurn: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean })
  canAddQuantity: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean })
  canUpdateAttributes: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean })
  canAddUri: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean })
  canTransferRole: boolean | undefined = undefined;
}
