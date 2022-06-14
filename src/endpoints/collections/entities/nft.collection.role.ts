import { ApiProperty } from "@nestjs/swagger";
import { NftCollection } from "./nft.collection";

export class NftCollectionRole extends NftCollection {
  @ApiProperty({ type: Boolean, nullable: true })
  canCreate: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canBurn: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canAddQuantity: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canUpdateAttributes: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canAddUri: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canTransferRole: boolean | undefined = undefined;
}
