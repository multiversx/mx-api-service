import { NftSupply } from './entities/nft.supply';
import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, NotFoundException, Param, Query, Res, Response } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { NftMediaService } from "src/queue.worker/nft.worker/queue/job-services/media/nft.media.service";
import { Nft } from "./entities/nft";
import { NftFilter } from "./entities/nft.filter";
import { NftOwner } from "./entities/nft.owner";
import { NftType } from "./entities/nft.type";
import { NftService } from "./nft.service";
import { QueryPagination } from 'src/common/entities/query.pagination';
import { NftQueryOptions } from './entities/nft.query.options';
import { ParseAddressPipe, ParseBoolPipe, ParseArrayPipe, ParseIntPipe, ParseNftPipe, ParseCollectionPipe, ApplyComplexity } from '@elrondnetwork/erdnest';

@Controller()
@ApiTags('nfts')
export class NftController {
  constructor(
    private readonly nftService: NftService,
    private readonly nftMediaService: NftMediaService,
  ) { }

  @Get("/nfts")
  @ApiOperation({ summary: 'Global NFTs', description: 'Returns a list of Non-Fungible / Semi-Fungible / MetaESDT tokens available on blockchain' })
  @ApiOkResponse({ type: [Nft] })
  @ApplyComplexity({ target: Nft })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'collection', description: 'Get all tokens by token collection', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'isWhitelistedStorage', description: 'Return all NFTs that are whitelisted in storage', required: false, type: Boolean })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false, type: Boolean })
  @ApiQuery({ name: 'isNsfw', description: 'Filter by NSFW status', required: false, type: Boolean })
  @ApiQuery({ name: 'before', description: 'Return all NFTs before given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'after', description: 'Return all NFTs after given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'withOwner', description: 'Return owner where type = NonFungibleESDT', required: false, type: Boolean })
  @ApiQuery({ name: 'withSupply', description: 'Return supply where type = SemiFungibleESDT', required: false, type: Boolean })
  async getNfts(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('type') type?: NftType,
    @Query('collection', ParseCollectionPipe) collection?: string,
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('isWhitelistedStorage', new ParseBoolPipe) isWhitelistedStorage?: boolean,
    @Query('hasUris', new ParseBoolPipe) hasUris?: boolean,
    @Query('isNsfw', new ParseBoolPipe) isNsfw?: boolean,
    @Query('before', new ParseIntPipe) before?: number,
    @Query('after', new ParseIntPipe) after?: number,
    @Query('withOwner', new ParseBoolPipe) withOwner?: boolean,
    @Query('withSupply', new ParseBoolPipe) withSupply?: boolean,
    @Query('withScamInfo', new ParseBoolPipe) withScamInfo?: boolean,
    @Query('computeScamInfo', new ParseBoolPipe) computeScamInfo?: boolean,
  ): Promise<Nft[]> {
    const options = NftQueryOptions.enforceScamInfoFlag(size, new NftQueryOptions({ withOwner, withSupply, withScamInfo, computeScamInfo }));

    return await this.nftService.getNfts(
      new QueryPagination({ from, size }),
      new NftFilter({ search, identifiers, type, collection, name, tags, creator, hasUris, isWhitelistedStorage, isNsfw, before, after }),
      options
    );
  }

  @Get("/nfts/count")
  @ApiOperation({ summary: 'Global NFT count', description: 'Returns the total number of Non-Fungible / Semi-Fungible / MetaESDT tokens' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'collection', description: 'Get all tokens by token collection', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'isWhitelistedStorage', description: 'Return all NFTs that are whitelisted in storage', required: false, type: Boolean })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false, type: Boolean })
  @ApiQuery({ name: 'isNsfw', description: 'Filter by NSFW status', required: false, type: Boolean })
  @ApiQuery({ name: 'before', description: 'Return all NFTs before given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'after', description: 'Return all NFTs after given timestamp', required: false, type: Number })
  async getNftCount(
    @Query('search') search?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('type') type?: NftType,
    @Query('collection', ParseCollectionPipe) collection?: string,
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('isWhitelistedStorage', new ParseBoolPipe) isWhitelistedStorage?: boolean,
    @Query('hasUris', new ParseBoolPipe) hasUris?: boolean,
    @Query('isNsfw', new ParseBoolPipe) isNsfw?: boolean,
    @Query('before', new ParseIntPipe) before?: number,
    @Query('after', new ParseIntPipe) after?: number,
  ): Promise<number> {
    return await this.nftService.getNftCount(new NftFilter({ search, identifiers, type, collection, name, tags, creator, isWhitelistedStorage, hasUris, isNsfw, before, after }));
  }

  @Get("/nfts/c")
  @ApiExcludeEndpoint()
  async getNftCountAlternative(
    @Query('search') search?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('type') type?: NftType,
    @Query('collection', ParseCollectionPipe) collection?: string,
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('isWhitelistedStorage', new ParseBoolPipe) isWhitelistedStorage?: boolean,
    @Query('isNsfw', new ParseBoolPipe) isNsfw?: boolean,
    @Query('hasUris', new ParseBoolPipe) hasUris?: boolean,
    @Query('before', new ParseIntPipe) before?: number,
    @Query('after', new ParseIntPipe) after?: number,
  ): Promise<number> {
    return await this.nftService.getNftCount(new NftFilter({ search, identifiers, type, collection, name, tags, creator, isWhitelistedStorage, hasUris, isNsfw, before, after }));
  }

  @Get('/nfts/:identifier')
  @ApiOperation({ summary: 'NFT details', description: 'Returns the details of an Non-Fungible / Semi-Fungible / MetaESDT token for a given identifier' })
  @ApiOkResponse({ type: Nft })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getNft(
    @Param('identifier', ParseNftPipe) identifier: string
  ): Promise<Nft> {
    const token = await this.nftService.getSingleNft(identifier);
    if (token === undefined) {
      throw new HttpException('NFT not found', HttpStatus.NOT_FOUND);
    }

    return token;
  }

  @Get('/nfts/:identifier/thumbnail')
  @ApiOperation({ summary: 'NFT thumbnail', description: 'Returns nft thumbnail' })
  @ApiOkResponse({ type: Nft })
  @ApiNotFoundResponse({ description: 'NFT thumbnail not found' })
  async resolveNftThumbnail(
    @Param('identifier', ParseNftPipe) identifier: string,
    @Res() response: Response
  ) {
    const nfts = await this.nftService.getNftsInternal(new QueryPagination({ from: 0, size: 1 }), new NftFilter(), identifier);
    if (nfts.length === 0) {
      throw new NotFoundException('NFT not found');
    }

    const media = await this.nftMediaService.getMedia(nfts[0].identifier);
    if (!media || media.length === 0) {
      // @ts-ignore
      response.redirect(this.nftService.DEFAULT_MEDIA[0].thumbnailUrl);
    } else {
      // @ts-ignore
      response.redirect(media[0].thumbnailUrl);
    }
  }

  @Get('/nfts/:identifier/supply')
  @ApiOperation({ summary: 'NFT supply', description: 'Returns Non-Fungible / Semi-Fungible / MetaESDT token supply details' })
  @ApiOkResponse({ type: NftSupply })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getNftSupply(
    @Param('identifier', ParseNftPipe) identifier: string
  ): Promise<{ supply: string }> {
    const totalSupply = await this.nftService.getNftSupply(identifier);
    if (!totalSupply) {
      throw new NotFoundException();
    }

    return { supply: totalSupply };
  }

  @Get('/nfts/:identifier/owners')
  @ApiOperation({ deprecated: true })
  @ApiResponse({ status: 200, description: 'Non-fungible / semi-fungible token owners', type: NftOwner })
  @ApiResponse({ status: 404, description: 'Token not found' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getNftOwners(
    @Param('identifier', ParseNftPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<NftOwner[]> {
    const owners = await this.nftService.getNftOwners(identifier, new QueryPagination({ from, size }));
    if (owners === undefined) {
      throw new HttpException('NFT not found', HttpStatus.NOT_FOUND);
    }

    return owners;
  }

  @Get('/nfts/:identifier/owners/count')
  @ApiOperation({ deprecated: true })
  @ApiResponse({ status: 200, description: 'Non-fungible / semi-fungible token owners count', type: Number })
  async getNftOwnersCount(
    @Param('identifier', ParseNftPipe) identifier: string
  ): Promise<number> {
    const ownersCount = await this.nftService.getNftOwnersCount(identifier);
    if (ownersCount === undefined) {
      throw new HttpException('NFT not found', HttpStatus.NOT_FOUND);
    }

    return ownersCount;
  }

  @Get('/nfts/:identifier/accounts')
  @ApiOperation({ summary: 'NFT accounts', description: 'Returns a list of addresses that hold balances for a specific Non-Fungible / Semi-Fungible / MetaESDT token' })
  @ApiOkResponse({ type: [NftOwner] })
  @ApiNotFoundResponse({ description: 'Token not found' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getNftAccounts(
    @Param('identifier', ParseNftPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<NftOwner[]> {
    const owners = await this.nftService.getNftOwners(identifier, new QueryPagination({ from, size }));
    if (owners === undefined) {
      throw new HttpException('NFT not found', HttpStatus.NOT_FOUND);
    }

    return owners;
  }

  @Get('/nfts/:identifier/accounts/count')
  @ApiOperation({ summary: 'NFT accounts count', description: 'Returns number of addresses that hold balances for a specific Non-Fungible / Semi-Fungible / MetaESDT token' })
  @ApiOkResponse({ type: Number })
  async getNftAccountsCount(
    @Param('identifier', ParseNftPipe) identifier: string
  ): Promise<number> {
    const ownersCount = await this.nftService.getNftOwnersCount(identifier);
    if (ownersCount === undefined) {
      throw new HttpException('NFT not found', HttpStatus.NOT_FOUND);
    }
    return ownersCount;
  }
}
