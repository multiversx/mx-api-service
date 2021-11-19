import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParseAddressPipe } from "src/utils/pipes/parse.address.pipe";
import { ParseArrayPipe } from "src/utils/pipes/parse.array.pipe";
import { ParseOptionalBoolPipe } from "src/utils/pipes/parse.optional.bool.pipe";
import { ParseOptionalEnumPipe } from "src/utils/pipes/parse.optional.enum.pipe";
import { EsdtService } from "../esdt/esdt.service";
import { Nft } from "./entities/nft";
import { NftOwner } from "./entities/nft.owner";
import { NftType } from "./entities/nft.type";
import { NftService } from "./nft.service";

@Controller()
@ApiTags('nfts')
export class NftController {
  constructor(
    private readonly nftService: NftService,
    private readonly esdtService: EsdtService,
  ) {}

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
		@Query('identifiers', ParseArrayPipe) identifiers: string[] | undefined,
		@Query('type') type: NftType | undefined,
		@Query('collection') collection: string | undefined,
		@Query('tags', ParseArrayPipe) tags: string[] | undefined,
		@Query('creator', ParseAddressPipe) creator: string | undefined,
		@Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
    @Query('withOwner', new ParseOptionalBoolPipe) withOwner: boolean | undefined,
    @Query('withSupply', new ParseOptionalBoolPipe) withSupply: boolean | undefined,
  ): Promise<Nft[]> {
    return await this.nftService.getNfts({ from, size }, { search, identifiers, type, collection, tags, creator, hasUris }, { withOwner, withSupply });
  }

  @Get("/nfts/count")
  @ApiResponse({
    status: 200,
    description: 'The number of non-fungible and semi-fungible tokens available on the blockchain',
  })
  @ApiQuery({ name: 'search', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
	@ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
	@ApiQuery({ name: 'collection', description: 'Get all tokens by token collection', required: false })
	@ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
	@ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
	@ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false })
  async getNftCount(
    @Query('search') search: string | undefined,
		@Query('identifiers', ParseArrayPipe) identifiers: string[] | undefined,
		@Query('type') type: NftType | undefined,
		@Query('collection') collection: string | undefined,
		@Query('tags', ParseArrayPipe) tags: string[] | undefined,
		@Query('creator', ParseAddressPipe) creator: string | undefined,
		@Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
  ): Promise<number> {
    return await this.nftService.getNftCount({ search, identifiers, type, collection, tags, creator, hasUris });
  }

  @Get("/nfts/c")
  @ApiExcludeEndpoint()
  async getNftCountAlternative(
    @Query('search') search: string | undefined,
		@Query('identifiers', ParseArrayPipe) identifiers: string[] | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('collection') collection: string | undefined,
		@Query('tags', ParseArrayPipe) tags: string[] | undefined,
		@Query('creator', ParseAddressPipe) creator: string | undefined,
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

  @Get('/nfts/:identifier/supply')
  @ApiResponse({
    status: 200,
    description: 'Non-fungible / semi-fungible token supply',
    type: Nft,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found'
  })
  async getNftSupply(@Param('identifier') identifier: string): Promise<{ supply: string }> {
    let supply = await this.esdtService.getTokenSupply(identifier);

    return { supply };
  }

  @Get('/nfts/:identifier/owners')
  @ApiResponse({
    status: 200,
    description: 'Non-fungible / semi-fungible token owners',
    type: NftOwner,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found'
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
	@ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getNftOwners(
    @Param('identifier') identifier: string,
  	@Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
		@Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<NftOwner[]> {
    let owners = await this.nftService.getNftOwners(identifier, { from, size });

    if (owners === undefined) {
      throw new HttpException('NFT not found', HttpStatus.NOT_FOUND);
    }

    return owners;
  }

  @Get('/nfts/:identifier/owners/count')
  @ApiResponse({
    status: 200,
    description: 'Non-fungible / semi-fungible token owners count',
    type: Number,
  })
  async getNftOwnersCount(@Param('identifier') identifier: string): Promise<number> {
    let ownersCount = await this.nftService.getNftOwnersCount(identifier);

    return ownersCount;
  }
}