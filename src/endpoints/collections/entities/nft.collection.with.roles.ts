import { ApiProperty } from "@nestjs/swagger";
import { CollectionRoles } from "src/endpoints/tokens/entities/collection.roles";
import { NftCollection } from "./nft.collection";

export class NftCollectionWithRoles extends NftCollection {
  constructor(init?: Partial<NftCollectionWithRoles>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ type: CollectionRoles })
  role: CollectionRoles = new CollectionRoles();

  @ApiProperty({ type: Boolean })
  canTransfer: Boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canCreate: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canBurn: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canAddQuantity: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canUpdateAttributes: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canAddUri: boolean = false;
}
