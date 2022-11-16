import { Args, Float, Resolver, Query } from "@nestjs/graphql";

import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { GetNftCollectionInput, GetNftCollectionsCountInput, GetNftCollectionsInput } from "src/graphql/entities/nft.collection/nft.collection.input";
import { NftCollection } from "src/endpoints/collections/entities/nft.collection";
import { QueryPagination } from "src/common/entities/query.pagination";
import { NotFoundException } from "@nestjs/common";
import { NftRank } from "src/common/assets/entities/nft.rank";

@Resolver()
export class NftCollectionQuery {
  constructor(protected readonly collectionService: CollectionService) { }

  @Query(() => Float, { name: "collectionsCount", description: "Retrieve all NFT collections count for the given input." })
  public async getNftCollectionsCount(@Args("input", { description: "Input to retrieve the given NFT collections count for." }) input: GetNftCollectionsCountInput): Promise<number> {
    return await this.collectionService.getNftCollectionCount(GetNftCollectionsCountInput.resolve(input));
  }

  @Query(() => [NftCollection], { name: "collections", description: "Retrieve all NFT collections for the given input." })
  public async getNftCollections(@Args("input", { description: "Input to retrieve the given NFT collections for." }) input: GetNftCollectionsInput): Promise<NftCollection[]> {
    return await this.collectionService.getNftCollections(
      new QueryPagination({ from: input.from, size: input.size }),
      new CollectionFilter({
        before: input.before,
        after: input.after,
        search: input.search,
        type: input.type,
        identifiers: input.identifiers,
        canBurn: input.canBurn,
        canAddQuantity: input.canAddQuantity,
        canUpdateAttributes: input.canUpdateAttributes,
        canAddUri: input.canAddUri,
        canTransferRole: input.canTransferRole,
        withoutMetaESDT: input.withoutMetaESDT,
      }),
    );
  }

  @Query(() => NftCollection, { name: "collection", description: "Retrieve the NFT collection for the given input.", nullable: true })
  public async getNftCollection(@Args("input", { description: "Input to retrieve the given NFT collection for." }) input: GetNftCollectionInput): Promise<NftCollection | undefined> {
    const collection = await this.collectionService.getNftCollection(GetNftCollectionInput.resolve(input));

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  @Query(() => [NftRank], { name: "collectionRank", description: "Retrieve the NFT collection ranks for the given input.", nullable: true })
  public async getNftCollectionRanks(@Args("input", { description: "Input to retrieve the given NFT collection ranks for." }) input: GetNftCollectionInput): Promise<NftRank[]> {
    const collection = await this.collectionService.getNftCollectionRanks(GetNftCollectionInput.resolve(input));

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

}
