import { ApiProperty } from "@nestjs/swagger";
import { CollectionRoles } from "src/endpoints/tokens/entities/collection.roles";
import { NftCollection } from "./nft.collection";

export class NftCollectionDetailed extends NftCollection {
  constructor(init?: Partial<NftCollectionDetailed>) {
    super();

    Object.assign(this, init);
  }

  @ApiProperty({ type: Boolean, nullable: true })
  canTransfer: boolean | undefined = undefined;

  @ApiProperty({ type: CollectionRoles, isArray: true })
  roles: CollectionRoles[] = [];
}
