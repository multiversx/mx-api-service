import { Parent, ResolveField, Resolver } from "@nestjs/graphql";

import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftCollection } from "src/endpoints/collections/entities/nft.collection";
import { NftLoader } from "src/graphql/entities/nft/nft.loader";
import { NftService } from "src/endpoints/nfts/nft.service";
import { NftQuery } from "src/graphql/entities/nft/nft.query";

@Resolver(() => Nft)
export class NftResolver extends NftQuery {
  constructor(
    private readonly nftLoader: NftLoader,
    nftService: NftService
  ) {
    super(nftService);
  }

  @ResolveField("collection", () => NftCollection, { name: "collection", description: "NFT collection for the given NFT." })
  public async getNftCollection(@Parent() nft: Nft) {
    return await this.nftLoader.getCollection(nft.collection);
  }
}
