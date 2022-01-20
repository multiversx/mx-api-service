import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParseOptionalEnumPipe } from "src/utils/pipes/parse.optional.enum.pipe";
import { NftCollection } from "./entities/nft.collection";
import { NftType } from "../nfts/entities/nft.type";
import { CollectionService } from "./collection.service";
import { ParseAddressPipe } from "src/utils/pipes/parse.address.pipe";
import { ParseArrayPipe } from "src/utils/pipes/parse.array.pipe";
import { EsdtService } from "../esdt/esdt.service";

@Controller()
@ApiTags('collections')
export class CollectionController {
  constructor(
    private readonly collectionService: CollectionService,
    private readonly esdtService: EsdtService,
  ) { }

  @Get("/collections")
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
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'creator', description: 'Filter NFTs where the given address has a creator role', required: false })
  @ApiResponse({
    status: 200,
    description: 'The number of non-fungible and semi-fungible token collections available on the blockchain',
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

  @Get('/collections/:identifier/supply')
  @ApiResponse({
    status: 200,
    description: 'Collection supply',
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found',
  })
  async getCollectionSupply(@Param('identifier') identifier: string): Promise<{ supply: string, circulatingSupply: string }> {
    const { totalSupply, circulatingSupply } = await this.esdtService.getTokenSupply(identifier);

    return { supply: totalSupply, circulatingSupply };
  }
}