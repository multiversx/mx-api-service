import { Field } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { CollectionRoles } from "src/endpoints/tokens/entities/collection.roles";
import { NftCollection } from "./nft.collection";

export class NftCollectionDetailed extends NftCollection {
  constructor(init?: Partial<NftCollectionDetailed>) {
    super();

    Object.assign(this, init);
  }

  @Field(() => Boolean, { description: 'If the given NFT collection can transfer the underlying tokens by default.', nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canTransfer: boolean | undefined = undefined;

  @Field(() => [CollectionRoles], { description: 'Roles list for the given NFT collection.', nullable: true })
  @ApiProperty({ type: CollectionRoles, isArray: true })
  roles: CollectionRoles[] = [];
}
