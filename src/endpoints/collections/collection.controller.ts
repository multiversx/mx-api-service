import { BadRequestException, Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParseOptionalEnumPipe } from "src/utils/pipes/parse.optional.enum.pipe";
import { NftCollection } from "./entities/nft.collection";
import { NftType } from "../nfts/entities/nft.type";
import { CollectionService } from "./collection.service";
import { ParseAddressPipe } from "src/utils/pipes/parse.address.pipe";
import { ParseArrayPipe } from "src/utils/pipes/parse.array.pipe";
import { Nft } from "../nfts/entities/nft";
import { ParseOptionalBoolPipe } from "src/utils/pipes/parse.optional.bool.pipe";
import { NftService } from "../nfts/nft.service";

@Controller()
@ApiTags('collections')
export class CollectionController {
  constructor(
    private readonly collectionService: CollectionService,
    private readonly nftService: NftService,
  ) { }

  @Get("/collections")
  @ApiOperation({ summary: 'Collections details', description: 'Returns collections details of NonFungibleESDT/SemiFungibleESDT/MetaESDT, as well as specific collections for a given address' })
  @ApiResponse({
    status: 200,
    description: 'List non-fungible and semi-fungible token collections',
    type: NftCollection,
    isArray: true,
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by collection identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'creator', description: 'Filter NFTs where the given address has a creator role', required: false })
  async getNftCollections(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search: string | undefined,
    @Query('identifiers', ParseArrayPipe) identifiers: string[] | undefined,
    @Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
    @Query('creator', ParseAddressPipe) creator: string | undefined,
  ): Promise<NftCollection[]> {
    return await this.collectionService.getNftCollections({ from, size }, { search, type, creator, identifiers });
  }

  @Get("/collections/count")
  @ApiOperation({ summary: 'Total number of collections available on the blockchain', description: 'Returns total number of collections where the account is creator, as well as total number of collections of a certain type NonFungibleESDT/SemiFungibleESDT/MetaESDT' })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'creator', description: 'Filter NFTs where the given address has a creator role', required: false })
  @ApiResponse({
    status: 200,
    description: 'The number of non-fungible and semi-fungible token collections available on the blockchain',
    type: Number,
  })
  async getCollectionCount(
    @Query('search') search: string | undefined,
    @Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
    @Query('creator', ParseAddressPipe) creator: string | undefined,
  ): Promise<number> {
    return await this.collectionService.getNftCollectionCount({ search, type, creator });
  }

  @Get("/collections/c")
  @ApiExcludeEndpoint()
  async getCollectionCountAlternative(
    @Query('search') search: string | undefined,
    @Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
    @Query('creator', ParseAddressPipe) creator: string | undefined,
  ): Promise<number> {
    return await this.collectionService.getNftCollectionCount({ search, type, creator });
  }

  @Get('/collections/:collection')
  @ApiOperation({ summary: 'Collection details', description: 'Returns collection details for a given collection identifier' })
  @ApiResponse({
    status: 200,
    description: 'Non-fungible / semi-fungible token collection details',
    type: NftCollection,
  })
  @ApiResponse({
    status: 404,
    description: 'Token collection not found',
  })
  async getNftCollection(@Param('collection') collection: string): Promise<NftCollection> {
    const token = await this.collectionService.getNftCollection(collection);
    if (token === undefined) {
      throw new HttpException('NFT collection not found', HttpStatus.NOT_FOUND);
    }

    return token;
  }

  @Get("/collections/:collection/nfts")
  @ApiOperation({ summary: 'Nfts details of a collection', description: 'Returns details about nfts that belong to a collection, also returns details about supply, owner and if the nft is whitelisted in storage as well as token details of a certain type from a specific collection' })
  @ApiResponse({
    status: 200,
    description: 'List non-fungible and semi-fungible tokens',
    type: Nft,
    isArray: true,
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'isWhitelistedStorage', description: 'Return all NFTs that are whitelisted in storage', required: false })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false })
  @ApiQuery({ name: 'withOwner', description: 'Return owner where type = NonFungibleESDT', required: false })
  @ApiQuery({ name: 'withSupply', description: 'Return supply where type = SemiFungibleESDT', required: false })
  async getNfts(
    @Param('collection') collection: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search: string | undefined,
    @Query('identifiers', ParseArrayPipe) identifiers: string[] | undefined,
    @Query('type') type: NftType | undefined,
    @Query('name') name: string | undefined,
    @Query('tags', ParseArrayPipe) tags: string[] | undefined,
    @Query('creator', ParseAddressPipe) creator: string | undefined,
    @Query('isWhitelistedStorage', new ParseOptionalBoolPipe) isWhitelistedStorage: boolean | undefined,
    @Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
    @Query('withOwner', new ParseOptionalBoolPipe) withOwner?: boolean | undefined,
    @Query('withSupply', new ParseOptionalBoolPipe) withSupply?: boolean | undefined,
  ): Promise<Nft[]> {
    if (withOwner === true && size > 100) {
      throw new BadRequestException(`Maximum size of 100 is allowed when activating flags 'withOwner' or 'withSupply'`);
    }

    return await this.nftService.getNfts({ from, size }, { search, identifiers, type, collection, name, tags, creator, hasUris, isWhitelistedStorage }, { withOwner, withSupply });
  }

  @Get("/collections/:collection/nfts/count")
  @ApiOperation({ summary: 'Total number of nfts from a collection', description: 'Return total number of Non-Fungible and Semi-Fungilbe tokens for a given collection.' })
  @ApiResponse({
    status: 200,
    description: 'The number of non-fungible and semi-fungible tokens from a collection',
    type: Number,
  })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'isWhitelistedStorage', description: 'Return all NFTs that are whitelisted in storage', required: false })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false })
  async getNftCount(
    @Param('collection') collection: string,
    @Query('search') search: string | undefined,
    @Query('identifiers', ParseArrayPipe) identifiers: string[] | undefined,
    @Query('type') type: NftType | undefined,
    @Query('name') name: string | undefined,
    @Query('tags', ParseArrayPipe) tags: string[] | undefined,
    @Query('creator', ParseAddressPipe) creator: string | undefined,
    @Query('isWhitelistedStorage', new ParseOptionalBoolPipe) isWhitelistedStorage: boolean | undefined,
    @Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
  ): Promise<number> {
    return await this.nftService.getNftCount({ search, identifiers, type, collection, name, tags, creator, isWhitelistedStorage, hasUris });
  }
}
