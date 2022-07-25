import { Args, Float, Resolver, Query } from "@nestjs/graphql";

import { GetNftInput, GetNftsCountInput, GetNftsInput } from "src/graphql/entities/nft/nft.input";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftService } from "src/endpoints/nfts/nft.service";
import { NftQueryOptions } from "src/endpoints/nfts/entities/nft.query.options";
import { QueryPagination } from "src/common/entities/query.pagination";

@Resolver()
export class NftQuery {
  constructor(protected readonly nftService: NftService) {}

  @Query(() => Float, { name: "nftsCount", description: "Retrieve all NFTs count for the given input." })
  public async getNftsCount(@Args("input", { description: "Input to retrieve the given NFTs count for." }) input: GetNftsCountInput): Promise<number> {
    return await this.nftService.getNftCount(GetNftsCountInput.resolve(input));
  }

  @Query(() => [Nft], { name: "nfts", description: "Retrieve all NFTs for the given input." })
  public async getNfts(@Args("input", { description: "Input to retrieve the given NFTs for." }) input: GetNftsInput): Promise<Nft[]> {
    return await this.nftService.getNfts(
      new QueryPagination({
        from: input.from, 
        size: input.size,
      }),
      new NftFilter({
        after: input.after,
        before: input.before,
        search: input.search, 
        identifiers: input.identifiers, 
        type: input.type, 
        collection: input.collection, 
        name: input.name, 
        tags: input.tags, 
        creator: input.creator, 
        hasUris: input.hasUris, 
        isWhitelistedStorage: input.isWhitelistedStorage, 
        isNsfw: input.isNsfw,
      }),
      new NftQueryOptions({
        withOwner: input.withOwner, 
        withSupply: input.withSupply,
      }),
    );
  }

  @Query(() => Nft, { name: "nft", description: "Retrieve the NFT for the given input.", nullable: true })
  public async getNft(@Args("input", { description: "Input to retrieve the given NFT for." }) input: GetNftInput): Promise<Nft | undefined> {
    return await this.nftService.getSingleNft(GetNftInput.resolve(input));
  }
}
