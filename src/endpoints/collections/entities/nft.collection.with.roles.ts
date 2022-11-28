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

  @Field(() => Boolean, { description: 'If the given collection role can create.', deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: Boolean, default: false })
  canCreate: boolean = false;

  @Field(() => Boolean, { description: 'If the given collection role can burn.', deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: Boolean, default: false })
  canBurn: boolean = false;

  @Field(() => Boolean, { description: 'If the given collection role can add quantity.', deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: Boolean, default: false })
  canAddQuantity: boolean = false;

  @Field(() => Boolean, { description: 'If the given collection role can update attributes.', deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: Boolean, default: false })
  canUpdateAttributes: boolean = false;

  @Field(() => Boolean, { description: 'If the given collection role can add URI.', deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: Boolean, default: false })
  canAddUri: boolean = false;
}
