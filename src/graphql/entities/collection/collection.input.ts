import { Field, InputType, Float } from "@nestjs/graphql";

import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";

@InputType({ description: "Input to retrieve the given collections count for." })
export class GetCollectionsCountInput {
  @Field(() => String, { name: "search", description: "Collection identifier to retrieve for the given result set.", nullable: true })
  search: string | undefined = undefined;

  @Field(() => [NftType], { name: "type", description: "Type to retrieve for the given result set.", nullable: true })
  type: Array<NftType> | undefined = undefined;

  @Field(() => String, { name: "creator", description: "Creator to retrieve for the given result set.", nullable: true })
  creator: string | undefined = undefined;

  @Field(() => String, { name: "canCreate", description: "Can create to retrieve for the given result set.", nullable: true })
  canCreate: string | undefined = undefined;

  @Field(() => String, { name: "canBurn", description: "Can burn to retrieve for the given result set.", nullable: true })
  canBurn: string | undefined = undefined;

  @Field(() => String, { name: "canAddQuantity", description: "Can add quantity to retrieve for the given result set.", nullable: true })
  canAddQuantity: string | undefined = undefined;

  @Field(() => String, { name: "canUpdateAttributes", description: "Can update attributes to retrieve for the given result set.", nullable: true })
  canUpdateAttributes: string | undefined = undefined;

  @Field(() => String, { name: "canAddUri", description: "Can add URI to retrieve for the given result set.", nullable: true })
  canAddUri: string | undefined = undefined;

  @Field(() => String, { name: "canTransferRole", description: "Can transfer role to retrieve for the given result set.", nullable: true })
  canTransferRole: string | undefined = undefined;

  public static resolve(input: GetCollectionsCountInput): CollectionFilter {
    return new CollectionFilter({
      search: input.search,
      type: input.type,
      canCreate: input.canCreate ?? input.creator,
      canBurn: input.canBurn,
      canAddQuantity: input.canAddQuantity,
      canUpdateAttributes: input.canUpdateAttributes,
      canAddUri: input.canAddUri,
      canTransferRole: input.canTransferRole,
    });
  }
}

@InputType({ description: "Input to retrieve the given collections for." })
export class GetCollectionsInput extends GetCollectionsCountInput {
  @Field(() => Float, { name: "from", description: "Number of collections to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of collections to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => [String], { name: "identifiers", description: "Collection comma-separated identifiers to retrieve for the given result set.", nullable: true })
  identifiers: Array<string> | undefined = undefined;
}

@InputType({ description: "Input to retrieve the given collection for." })
export class GetCollectionInput {
  @Field(() => String, { name: "collection", description: "Collection identifier to retrieve the corresponding collection." })
  collection: string = "";

  public static resolve(input: GetCollectionInput): string {
    return input.collection;
  }
}
