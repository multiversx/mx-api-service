import { Field, InputType, Float, ID } from "@nestjs/graphql";

import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";

@InputType({ description: "Input to retrieve the given NFTs count for." })
export class GetNftsCountInput {
  constructor(partial?: Partial<GetNftsCountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "search", description: "NFT identifier to retrieve for the given result set.", nullable: true })
  search: string | undefined = undefined;

  @Field(() => [ID], { name: "identifiers", description: "NFT comma-separated identifiers list to retrieve for the given result set.", nullable: true })
  identifiers: Array<string> | undefined = undefined;

  @Field(() => NftType, { name: "type", description: "NFT type to retrieve for the given result set.", nullable: true })
  type: NftType | undefined = undefined;

  @Field(() => ID, { name: "collection", description: "Collection identifier for the given result set.", nullable: true })
  collection: string | undefined = "";

  @Field(() => String, { name: "name", description: "Name to retrieve for the given result set.", nullable: true })
  name: string | undefined = undefined;

  @Field(() => [String], { name: "tags", description: "Tags list to retrieve for the given result set.", nullable: true })
  tags: Array<string> | undefined = undefined;

  @Field(() => String, { name: "creator", description: "Creator to retrieve for the given result set.", nullable: true })
  creator: string | undefined = undefined;

  @Field(() => Boolean, { name: "isWhitelistedStorage", description: "Is whitelisted storage to retrieve for the given result set.", nullable: true })
  isWhitelistedStorage: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "isNsfw", description: "Is NSFW to retrieve for the given result set.", nullable: true })
  isNsfw: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "hasUris", description: "Has URIs to retrieve for the given result set.", nullable: true })
  hasUris: boolean | undefined = undefined;

  @Field(() => Float, { name: "before", description: "Before timestamp to retrieve for the given result set.", nullable: true })
  before: number | undefined = undefined;

  @Field(() => Float, { name: "after", description: "After timestamp to retrieve for the given result set.", nullable: true })
  after: number | undefined = undefined;

  @Field(() => Float, { name: "nonce", description: "Nonce to retrieve for the given result set.", nullable: true })
  nonce: number | undefined = undefined;

  public static resolve(input: GetNftsCountInput): NftFilter {
    return new NftFilter({
      after: input.after,
      before: input.before,
      search: input.search,
      identifiers: input.identifiers,
      type: input.type,
      collection: input.collection,
      name: input.name,
      tags: input.tags,
      creator: input.creator,
      isWhitelistedStorage: input.isWhitelistedStorage,
      hasUris: input.hasUris,
      isNsfw: input.isNsfw,
      nonce: input.nonce,
    });
  }
}

@InputType({ description: "Input to retrieve the given NFTs for." })
export class GetNftsInput extends GetNftsCountInput {
  constructor(partial?: Partial<GetNftsInput>) {
    super();

    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of collections to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of collections to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => Boolean, { name: "withOwner", description: "With owner to retrieve for the given result set.", nullable: true })
  withOwner: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "withSupply", description: "With supply to retrieve for the given result set.", nullable: true })
  withSupply: boolean | undefined = undefined;
}

@InputType({ description: "Input to retrieve the given NFT for." })
export class GetNftInput {
  constructor(partial?: Partial<GetNftInput>) {
    Object.assign(this, partial);
  }

  @Field(() => ID, { name: "identifier", description: "Identifier to retrieve the corresponding NFT for." })
  identifier: string = "";

  public static resolve(input: GetNftInput): string {
    return input.identifier;
  }
}
