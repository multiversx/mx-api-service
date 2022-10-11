import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { NftCollection } from "./entities/nft.collection";
import { NftType } from "../nfts/entities/nft.type";
import { CollectionService } from "./collection.service";
import { Nft } from "../nfts/entities/nft";
import { NftService } from "../nfts/nft.service";
import { NftFilter } from "../nfts/entities/nft.filter";
import { NftQueryOptions } from "../nfts/entities/nft.query.options";
import { ParseAddressPipe, ParseArrayPipe, ParseCollectionPipe, ParseBoolPipe, ParseEnumArrayPipe, ParseIntPipe, ApplyComplexity, ParseAddressArrayPipe, ParseBlockHashPipe, ParseEnumPipe, ParseRecordPipe } from '@elrondnetwork/erdnest';
import { QueryPagination } from "src/common/entities/query.pagination";
import { CollectionFilter } from "./entities/collection.filter";
import { CollectionAccount } from "./entities/collection.account";
import { TransactionDetailed } from "../transactions/entities/transaction.detailed";
import { Transaction } from "../transactions/entities/transaction";
import { TransactionStatus } from "../transactions/entities/transaction.status";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionQueryOptions } from "../transactions/entities/transactions.query.options";
import { TransactionService } from "../transactions/transaction.service";
import { TransactionFilter } from "../transactions/entities/transaction.filter";

@Controller()
@ApiTags('collections')
export class CollectionController {
  constructor(
    private readonly collectionService: CollectionService,
    private readonly nftService: NftService,
    private readonly transactionService: TransactionService,
  ) { }

  @Get("/collections")
  @ApiOperation({ summary: 'Collections', description: 'Returns non-fungible/semi-fungible/meta-esdt collections' })
  @ApiOkResponse({ type: [NftCollection] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by collection identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'creator', description: 'Filter collections where the given address has a creator role', required: false, deprecated: true })
  @ApiQuery({ name: 'before', description: 'Return all collections before given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'after', description: 'Return all collections after given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'canCreate', description: 'Filter by address with canCreate role', required: false })
  @ApiQuery({ name: 'canBurn', description: 'Filter by address with canBurn role', required: false })
  @ApiQuery({ name: 'canAddQuantity', description: 'Filter by address with canAddQuantity role', required: false })
  @ApiQuery({ name: 'canUpdateAttributes', description: 'Filter by address with canUpdateAttributes role', required: false })
  @ApiQuery({ name: 'canAddUri', description: 'Filter by address with canAddUri role', required: false })
  @ApiQuery({ name: 'canTransferRole', description: 'Filter by address with canTransferRole role', required: false })
  async getNftCollections(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('type', new ParseEnumArrayPipe(NftType)) type?: NftType[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('before', new ParseIntPipe) before?: number,
    @Query('after', new ParseIntPipe) after?: number,
    @Query('canCreate', new ParseAddressPipe) canCreate?: string,
    @Query('canBurn', new ParseAddressPipe) canBurn?: string,
    @Query('canAddQuantity', new ParseAddressPipe) canAddQuantity?: string,
    @Query('canUpdateAttributes', new ParseAddressPipe) canUpdateAttributes?: string,
    @Query('canAddUri', new ParseAddressPipe) canAddUri?: string,
    @Query('canTransferRole', new ParseAddressPipe) canTransferRole?: string,
  ): Promise<NftCollection[]> {
    return await this.collectionService.getNftCollections(new QueryPagination({ from, size }), new CollectionFilter({
      search,
      type,
      identifiers,
      canCreate: canCreate ?? creator,
      before,
      after,
      canBurn,
      canAddQuantity,
      canUpdateAttributes,
      canAddUri,
      canTransferRole,
    }));
  }

  @Get("/collections/count")
  @ApiOperation({ summary: 'Collection count', description: 'Returns non-fungible/semi-fungible/meta-esdt collection count' })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'creator', description: 'Filter collections where the given address has a creator role', required: false, deprecated: true })
  @ApiQuery({ name: 'before', description: 'Return all collections before given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'after', description: 'Return all collections after given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'canCreate', description: 'Filter by address with canCreate role', required: false })
  @ApiQuery({ name: 'canBurn', description: 'Filter by address with canBurn role', required: false })
  @ApiQuery({ name: 'canAddQuantity', description: 'Filter by address with canAddQuantity role', required: false })
  @ApiQuery({ name: 'canUpdateAttributes', description: 'Filter by address with canUpdateAttributes role', required: false })
  @ApiQuery({ name: 'canAddUri', description: 'Filter by address with canAddUri role', required: false })
  @ApiQuery({ name: 'canTransferRole', description: 'Filter by address with canTransferRole role', required: false })
  @ApiOkResponse({ type: Number })
  async getCollectionCount(
    @Query('search') search?: string,
    @Query('type', new ParseEnumArrayPipe(NftType)) type?: NftType[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('before', new ParseIntPipe) before?: number,
    @Query('after', new ParseIntPipe) after?: number,
    @Query('canCreate', new ParseAddressPipe) canCreate?: string,
    @Query('canBurn', new ParseAddressPipe) canBurn?: string,
    @Query('canAddQuantity', new ParseAddressPipe) canAddQuantity?: string,
    @Query('canUpdateAttributes', new ParseAddressPipe) canUpdateAttributes?: string,
    @Query('canAddUri', new ParseAddressPipe) canAddUri?: string,
    @Query('canTransferRole', new ParseAddressPipe) canTransferRole?: string,
  ): Promise<number> {
    return await this.collectionService.getNftCollectionCount(new CollectionFilter({
      search,
      type,
      canCreate: canCreate ?? creator,
      before,
      after,
      canBurn,
      canAddQuantity,
      canUpdateAttributes,
      canAddUri,
      canTransferRole,
    }));
  }

  @Get("/collections/c")
  @ApiExcludeEndpoint()
  async getCollectionCountAlternative(
    @Query('search') search?: string,
    @Query('type', new ParseEnumArrayPipe(NftType)) type?: NftType[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('before', new ParseIntPipe) before?: number,
    @Query('after', new ParseIntPipe) after?: number,
    @Query('canCreate', new ParseAddressPipe) canCreate?: string,
    @Query('canBurn', new ParseAddressPipe) canBurn?: string,
    @Query('canAddQuantity', new ParseAddressPipe) canAddQuantity?: string,
    @Query('canUpdateAttributes', new ParseAddressPipe) canUpdateAttributes?: string,
    @Query('canAddUri', new ParseAddressPipe) canAddUri?: string,
    @Query('canTransferRole', new ParseAddressPipe) canTransferRole?: string,
  ): Promise<number> {
    return await this.collectionService.getNftCollectionCount(new CollectionFilter({
      search,
      type,
      canCreate: canCreate ?? creator,
      before,
      after,
      canBurn,
      canAddQuantity,
      canUpdateAttributes,
      canAddUri,
      canTransferRole,
    }));
  }

  @Get('/collections/:collection')
  @ApiOperation({ summary: 'Collection details', description: 'Returns non-fungible/semi-fungible/meta-esdt collection details' })
  @ApiOkResponse({ type: NftCollection })
  @ApiNotFoundResponse({ description: 'Token collection not found' })
  async getNftCollection(
    @Param('collection', ParseCollectionPipe) collection: string
  ): Promise<NftCollection> {
    const token = await this.collectionService.getNftCollection(collection);
    if (token === undefined) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return token;
  }

  @Get("/collections/:collection/nfts")
  @ApiOperation({ summary: 'Collection NFTs', description: 'Returns non-fungible/semi-fungible/meta-esdt tokens that belong to a collection' })
  @ApiOkResponse({ type: [Nft] })
  @ApplyComplexity({ target: Nft })
  @ApiNotFoundResponse({ description: 'Token collection not found' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'isWhitelistedStorage', description: 'Return all NFTs that are whitelisted in storage', required: false, type: Boolean })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false, type: Boolean })
  @ApiQuery({ name: 'isNsfw', description: 'Filter by NSFW status', required: false, type: Boolean })
  @ApiQuery({ name: 'traits', description: 'Filter NFTs by traits. Key-value format (<key1>:<value1>;<key2>:<value2>)', required: false, type: Boolean })
  @ApiQuery({ name: 'nonce', description: 'Return all NFTs with given nonce', required: false, type: Number })
  @ApiQuery({ name: 'withOwner', description: 'Return owner where type = NonFungibleESDT', required: false, type: Boolean })
  @ApiQuery({ name: 'withSupply', description: 'Return supply where type = SemiFungibleESDT', required: false, type: Boolean })
  @ApiQuery({ name: 'withScamInfo', required: false, type: Boolean })
  @ApiQuery({ name: 'computeScamInfo', required: false, type: Boolean })
  async getNfts(
    @Param('collection', ParseCollectionPipe) collection: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('isWhitelistedStorage', new ParseBoolPipe) isWhitelistedStorage?: boolean,
    @Query('hasUris', new ParseBoolPipe) hasUris?: boolean,
    @Query('isNsfw', new ParseBoolPipe) isNsfw?: boolean,
    @Query('traits', new ParseRecordPipe) traits?: Record<string, string>,
    @Query('nonce', new ParseIntPipe) nonce?: number,
    @Query('nonceBefore', new ParseIntPipe) nonceBefore?: number,
    @Query('nonceAfter', new ParseIntPipe) nonceAfter?: number,
    @Query('withOwner', new ParseBoolPipe) withOwner?: boolean,
    @Query('withSupply', new ParseBoolPipe) withSupply?: boolean,
    @Query('withScamInfo', new ParseBoolPipe) withScamInfo?: boolean,
    @Query('computeScamInfo', new ParseBoolPipe) computeScamInfo?: boolean,
  ): Promise<Nft[]> {
    const isCollection = await this.collectionService.isCollection(collection);
    if (!isCollection) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    const options = NftQueryOptions.enforceScamInfoFlag(size, new NftQueryOptions({ withOwner, withSupply, withScamInfo, computeScamInfo }));

    return await this.nftService.getNfts(
      new QueryPagination({ from, size }),
      new NftFilter({ search, identifiers, collection, name, tags, creator, hasUris, isWhitelistedStorage, isNsfw, traits, nonce, nonceAfter, nonceBefore }),
      options);
  }

  @Get("/collections/:collection/nfts/count")
  @ApiOperation({ summary: 'Collection NFT count', description: 'Returns non-fungible/semi-fungible/meta-esdt token count that belong to a collection' })
  @ApiOkResponse({ type: Number })
  @ApiNotFoundResponse({ description: 'Token collection not found' })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'nonce', description: 'Return NFTs count with given nonce', required: false, type: Number })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'isWhitelistedStorage', description: 'Return all NFTs that are whitelisted in storage', required: false, type: Boolean })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false, type: Boolean })
  @ApiQuery({ name: 'traits', description: 'Filter NFTs by traits. Key-value format (<key1>:<value1>;<key2>:<value2>)', required: false, type: Boolean })
  async getNftCount(
    @Param('collection', ParseCollectionPipe) collection: string,
    @Query('search') search?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('nonce', new ParseIntPipe) nonce?: number,
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('isWhitelistedStorage', new ParseBoolPipe) isWhitelistedStorage?: boolean,
    @Query('hasUris', new ParseBoolPipe) hasUris?: boolean,
    @Query('traits', new ParseRecordPipe) traits?: Record<string, string>,
  ): Promise<number> {
    const isCollection = await this.collectionService.isCollection(collection);
    if (!isCollection) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return await this.nftService.getNftCount(new NftFilter({ search, identifiers, collection, name, tags, creator, isWhitelistedStorage, hasUris, traits, nonce }));
  }

  @Get('/collections/:identifier/accounts')
  @ApiOperation({ summary: 'Collection accounts', description: 'Returns a list of addresses and balances for a specific collection' })
  @ApiOkResponse({ type: [CollectionAccount] })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getNftAccounts(
    @Param('identifier', ParseCollectionPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<CollectionAccount[]> {
    const owners = await this.nftService.getCollectionOwners(identifier, new QueryPagination({ from, size }));
    if (!owners) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return owners;
  }

  @Get("/collections/:collection/transactions")
  @ApiOperation({ summary: 'Collection transactions', description: `Returns a list of transactions for a specific collection.` })
  @ApplyComplexity({ target: TransactionDetailed })
  @ApiOkResponse({ type: [Transaction] })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'function', description: 'Filter transactions by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'withScResults', description: 'Return scResults for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withOperations', description: 'Return operations for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withLogs', description: 'Return logs for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withScamInfo', required: false, type: Boolean })
  async getCollectionTransactions(
    @Param('collection', ParseCollectionPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('search') search?: string,
    @Query('function') scFunction?: string,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('withScResults', new ParseBoolPipe) withScResults?: boolean,
    @Query('withOperations', new ParseBoolPipe) withOperations?: boolean,
    @Query('withLogs', new ParseBoolPipe) withLogs?: boolean,
    @Query('withScamInfo', new ParseBoolPipe) withScamInfo?: boolean,
  ) {
    const options = TransactionQueryOptions.enforceScamInfoFlag(size, { withScResults, withOperations, withLogs, withScamInfo });
    const isCollection = await this.collectionService.isCollection(identifier);
    if (!isCollection) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return await this.transactionService.getTransactions(new TransactionFilter({
      sender,
      receivers: receiver,
      token: identifier,
      function: scFunction,
      senderShard,
      receiverShard,
      miniBlockHash,
      hashes,
      status,
      search,
      before,
      after,
      order,
    }), new QueryPagination({ from, size }), options);
  }

  @Get("/collections/:collection/transactions/count")
  @ApiOperation({ summary: 'NFT transactions count', description: 'Returns the total number of transactions for a specific collection' })
  @ApiOkResponse({ type: Number })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  async getCollectionTransactionsCount(
    @Param('collection', ParseCollectionPipe) identifier: string,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('search') search?: string,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
  ) {
    const isCollection = await this.collectionService.isCollection(identifier);
    if (!isCollection) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return await this.transactionService.getTransactionCount(new TransactionFilter({
      sender,
      receivers: receiver,
      token: identifier,
      senderShard,
      receiverShard,
      miniBlockHash,
      hashes,
      status,
      search,
      before,
      after,
    }));
  }
}
