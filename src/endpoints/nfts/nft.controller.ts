import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParseOptionalBoolPipe } from "src/utils/pipes/parse.optional.bool.pipe";
import { ParseOptionalEnumPipe } from "src/utils/pipes/parse.optional.enum.pipe";
import { Nft } from "./entities/nft";
import { NftCollection } from "./entities/nft.collection";
import { NftDetailed } from "./entities/nft.detailed";
import { NftType } from "./entities/nft.type";
import { NftService } from "./nft.service";

@Controller()
@ApiTags('nfts')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Get("/collections")
  @ApiResponse({
    status: 200,
    description: 'List non-fungible and semi-fungible token collections',
    type: NftCollection,
    isArray: true
  })
	@ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
	@ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
	@ApiQuery({ name: 'search', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT)', required: false })
	@ApiQuery({ name: 'issuer', description: 'Filter by token issuer', required: false })
  async getNftCollections(
		@Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
		@Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
		@Query('search') search: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('issuer') issuer: string | undefined,
  ): Promise<NftCollection[]> {
    return await this.nftService.getNftCollections({ from, size }, { search, type, issuer, identifiers: [] });
  }

  @Get("/collections/count")
	@ApiQuery({ name: 'search', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT)', required: false })
	@ApiQuery({ name: 'issuer', description: 'Filter by token issuer', required: false })
  @ApiResponse({
    status: 200,
    description: 'The number of non-fungible and semi-fungible token collections available on the blockchain',
  })
  async getCollectionCount(
    @Query('search') search: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('issuer') issuer: string | undefined,
  ): Promise<number> {
    return await this.nftService.getNftCollectionCount({ search, type, issuer, identifiers: [] });
  }

  @Get("/collections/c")
  @ApiExcludeEndpoint()
  async getCollectionCountAlternative(
    @Query('search') search: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('issuer') issuer: string | undefined,
  ): Promise<number> {
    return await this.nftService.getNftCollectionCount({ search, type, issuer, identifiers: [] });
  }

  @Get('/collections/:collection')
  @ApiResponse({
    status: 200,
    description: 'Non-fungible / semi-fungible token collection details',
    type: NftCollection,
  })
  @ApiResponse({
    status: 404,
    description: 'Token collection not found'
  })
  async getNftCollection(@Param('collection') collection: string): Promise<NftCollection> {
    let token = await this.nftService.getNftCollection(collection);
    if (token === undefined) {
      throw new HttpException('NFT collection not found', HttpStatus.NOT_FOUND);
    }

    return token;
  }

  @Get("/nfts")
  @ApiResponse({
    status: 200,
    description: 'List non-fungible and semi-fungible tokens',
    type: Nft,
    isArray: true
  })
	@ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
	@ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
	@ApiQuery({ name: 'search', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
	@ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT)', required: false })
	@ApiQuery({ name: 'collection', description: 'Get all tokens by token collection', required: false })
	@ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
	@ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
	@ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false })
  @ApiQuery({ name: 'withOwner', description: 'Return owner where type = NonFungibleESDT', required: false })
  @ApiQuery({ name: 'withSupply', description: 'Return supply where type = SemiFungibleESDT', required: false })
  async getNfts(
		@Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
		@Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
		@Query('search') search: string | undefined,
		@Query('identifiers') identifiers: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('collection') collection: string | undefined,
		@Query('tags') tags: string | undefined,
		@Query('creator') creator: string | undefined,
		@Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
    @Query('withOwner', new ParseOptionalBoolPipe) withOwner: boolean | undefined,
    @Query('withSupply', new ParseOptionalBoolPipe) withSupply: boolean | undefined,
  ): Promise<Nft[] | NftDetailed[]> {
    return await this.nftService.getNfts({ from, size }, { search, identifiers, type, collection, tags, creator, hasUris }, { withOwner, withSupply });
  }

  @Get("/nfts/count")
  @ApiResponse({
    status: 200,
    description: 'The number of non-fungible and semi-fungible tokens available on the blockchain',
  })
  @ApiQuery({ name: 'search', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
	@ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT)', required: false })
	@ApiQuery({ name: 'collection', description: 'Get all tokens by token collection', required: false })
	@ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
	@ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
	@ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false })
  async getNftCount(
    @Query('search') search: string | undefined,
		@Query('identifiers') identifiers: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('collection') collection: string | undefined,
		@Query('tags') tags: string | undefined,
		@Query('creator') creator: string | undefined,
		@Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
  ): Promise<number> {
    return await this.nftService.getNftCount({ search, identifiers, type, collection, tags, creator, hasUris });
  }

  @Get("/nfts/c")
  @ApiExcludeEndpoint()
  async getNftCountAlternative(
    @Query('search') search: string | undefined,
		@Query('identifiers') identifiers: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('collection') collection: string | undefined,
		@Query('tags') tags: string | undefined,
		@Query('creator') creator: string | undefined,
		@Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
  ): Promise<number> {
    return await this.nftService.getNftCount({ search, identifiers, type, collection, tags, creator, hasUris });
  }

  @Get('/nfts/:identifier')
  @ApiResponse({
    status: 200,
    description: 'Non-fungible / semi-fungible token details',
    type: Nft,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found'
  })
  async getNft(@Param('identifier') identifier: string): Promise<Nft> {
    let token = await this.nftService.getSingleNft(identifier);
    if (token === undefined) {
      throw new HttpException('NFT not found', HttpStatus.NOT_FOUND);
    }

    return token;
  }
}