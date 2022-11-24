import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { CollectionRoles } from "src/endpoints/tokens/entities/collection.roles";
import { NftCollection } from "./nft.collection";

@ObjectType("NftCollection", { description: "NFT collection with roles object type." })
export class NftCollectionWithRoles extends NftCollection {
  constructor(init?: Partial<NftCollectionWithRoles>) {
    super();
    Object.assign(this, init);
  }

  @Field(() => CollectionRoles, { description: 'Collection roles for the current address.' })
  @ApiProperty({ type: CollectionRoles })
  roles: CollectionRoles = new CollectionRoles();

  @Field(() => Boolean, { description: 'Determines whether the collection is globally transferrable.' })
  @ApiProperty({ type: Boolean })
  canTransfer: Boolean = false;
}
