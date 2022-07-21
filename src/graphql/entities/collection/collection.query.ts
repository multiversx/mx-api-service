import { Args, Float, Resolver, Query } from "@nestjs/graphql";

import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { GetCollectionInput, GetCollectionsCountInput, GetCollectionsInput } from "src/graphql/entities/collection/collection.input";
import { NftCollection } from "src/endpoints/collections/entities/nft.collection";
import { QueryPagination } from "src/common/entities/query.pagination";

@Resolver()
export class CollectionQuery {
  constructor(protected readonly collectionService: CollectionService) {}

  @Query(() => Float, { name: "collectionsCount", description: "Retrieve all collections count for the given input." })
  public async getCollectionsCount(@Args("input", { description: "Input to retrieve the given collections count for." }) input: GetCollectionsCountInput): Promise<number> {
    return await this.collectionService.getNftCollectionCount(GetCollectionsCountInput.resolve(input));
  }

  @Query(() => [NftCollection], { name: "collections", description: "Retrieve all collections for the given input." })
  public async getCollections(@Args("input", { description: "Input to retrieve the given collections for." }) input: GetCollectionsInput): Promise<NftCollection[]> {
    return await this.collectionService.getNftCollections(
      new QueryPagination({ from: input.from, size: input.size }),
      new CollectionFilter({
        search: input.search,
        type: input.type,
        identifiers: input.identifiers,
        canCreate: input.canCreate ?? input.creator,
        canBurn: input.canBurn,
        canAddQuantity: input.canAddQuantity,
        canUpdateAttributes: input.canUpdateAttributes,
        canAddUri: input.canAddUri,
        canTransferRole: input.canTransferRole,
      }), 
    );
  }

  @Query(() => NftCollection, { name: "collection", description: "Retrieve the collection for the given input.", nullable: true })
  public async getCollection(@Args("input", { description: "Input to retrieve the given collection for." }) input: GetCollectionInput): Promise<NftCollection | undefined> {
    return await this.collectionService.getNftCollection(GetCollectionInput.resolve(input));
  }
}
