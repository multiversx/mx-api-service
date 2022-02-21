import { BadRequestException, Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Logger, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { AccountDetailed } from './entities/account.detailed';
import { Account } from './entities/account';
import { AccountDeferred } from './entities/account.deferred';
import { TokenService } from '../tokens/token.service';
import { TokenWithBalance } from '../tokens/entities/token.with.balance';
import { DelegationLegacyService } from '../delegation.legacy/delegation.legacy.service';
import { AccountDelegationLegacy } from '../delegation.legacy/entities/account.delegation.legacy';
import { AccountKey } from './entities/account.key';
import { NftAccount } from '../nfts/entities/nft.account';
import { ParseOptionalEnumPipe } from 'src/utils/pipes/parse.optional.enum.pipe';
import { NftType } from '../nfts/entities/nft.type';
import { ParseOptionalBoolPipe } from 'src/utils/pipes/parse.optional.bool.pipe';
import { WaitingList } from '../waiting-list/entities/waiting.list';
import { WaitingListService } from '../waiting-list/waiting.list.service';
import { StakeService } from '../stake/stake.service';
import { NftService } from '../nfts/nft.service';
import { ParseOptionalIntPipe } from 'src/utils/pipes/parse.optional.int.pipe';
import { TransactionStatus } from '../transactions/entities/transaction.status';
import { TransactionService } from '../transactions/transaction.service';
import { DeployedContract } from './entities/deployed.contract';
import { SmartContractResult } from '../sc-results/entities/smart.contract.result';
import { SmartContractResultService } from '../sc-results/scresult.service';
import { CollectionService } from '../collections/collection.service';
import { NftCollectionAccount } from '../collections/entities/nft.collection.account';
import { ParseAddressPipe } from 'src/utils/pipes/parse.address.pipe';
import { ParseTransactionHashPipe } from 'src/utils/pipes/parse.transaction.hash.pipe';
import { ParseBlockHashPipe } from 'src/utils/pipes/parse.block.hash.pipe';
import { ParseArrayPipe } from 'src/utils/pipes/parse.array.pipe';
import { SortOrder } from 'src/common/entities/sort.order';
import { AccountHistory } from "./entities/account.history";
import { AccountEsdtHistory } from "./entities/account.esdt.history";
import { EsdtDataSource } from '../esdt/entities/esdt.data.source';

@Controller()
@ApiTags('accounts')
export class AccountController {
  private readonly logger: Logger;

  constructor(
    private readonly accountService: AccountService,
    private readonly tokenService: TokenService,
    private readonly nftService: NftService,
    private readonly delegationLegacyService: DelegationLegacyService,
    private readonly waitingListService: WaitingListService,
    private readonly stakeService: StakeService,
    private readonly transactionService: TransactionService,
    private readonly scResultService: SmartContractResultService,
    private readonly collectionService: CollectionService,
  ) {
    this.logger = new Logger(AccountController.name);
  }

  @Get("/accounts")
  @ApiResponse({
    status: 200,
    description: 'The accounts available on the blockchain',
    type: Account,
    isArray: true,
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  getAccounts(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<Account[]> {
    return this.accountService.getAccounts({ from, size });
  }

  @Get("/accounts/count")
  @ApiResponse({
    status: 200,
    description: 'The number of accounts available on the blockchain',
  })
  async getAccountsCount(): Promise<number> {
    return await this.accountService.getAccountsCount();
  }

  @Get("/accounts/c")
  @ApiExcludeEndpoint()
  async getAccountsCountAlternative(): Promise<number> {
    return await this.accountService.getAccountsCount();
  }

  @Get("/accounts/:address")
  @ApiResponse({
    status: 200,
    description: 'The details of a given account',
    type: AccountDetailed,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getAccountDetails(@Param('address', ParseAddressPipe) address: string): Promise<AccountDetailed> {
    const account = await this.accountService.getAccount(address);
    if (!account) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    return account;
  }

  @Get("/accounts/:address/deferred")
  @ApiResponse({
    status: 200,
    description: 'The deferred details of a given account',
    type: AccountDeferred,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getAccountDeferred(@Param('address', ParseAddressPipe) address: string): Promise<AccountDeferred[]> {
    try {
      return await this.accountService.getDeferredAccount(address);
    } catch (error) {
      this.logger.error(`Error in getAccountDeferred for address ${address}`);
      this.logger.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/tokens")
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'name', description: 'Search by token name', required: false })
  @ApiQuery({ name: 'identifier', description: 'Search by token identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'A comma-separated list of identifiers to filter by', required: false })
  @ApiResponse({
    status: 200,
    description: 'The tokens of a given account',
    type: TokenWithBalance,
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getAccountTokens(
    @Param('address', ParseAddressPipe) address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('identifier') identifier?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
  ): Promise<TokenWithBalance[]> {
    try {
      return await this.tokenService.getTokensForAddress(address, { from, size }, { search, name, identifier, identifiers });
    } catch (error) {
      this.logger.error(`Error in getAccountTokens for address ${address}`);
      this.logger.error(error);
      // throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      return [];
    }
  }

  @Get("/accounts/:address/tokens/count")
  @ApiResponse({
    status: 200,
    description: 'The number of tokens available on the blockchain for the given address',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getTokenCount(@Param('address', ParseAddressPipe) address: string): Promise<number> {
    try {
      return await this.tokenService.getTokenCountForAddress(address);
    } catch (error) {
      this.logger.error(`Error in getTokenCount for address ${address}`);
      this.logger.error(error);
      // throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      return 0;
    }
  }

  @Get("/accounts/:address/tokens/c")
  @ApiExcludeEndpoint()
  async getTokenCountAlternative(@Param('address', ParseAddressPipe) address: string): Promise<number> {
    try {
      return await this.tokenService.getTokenCountForAddress(address);
    } catch (error) {
      this.logger.error(`Error in getTokenCount for address ${address}`);
      this.logger.error(error);
      // throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      return 0;
    }
  }

  @Get("/accounts/:address/collections")
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'owner', description: 'Filter by collection owner', required: false })
  @ApiQuery({ name: 'canCreate', description: 'Filter by property canCreate (boolean)', required: false })
  @ApiQuery({ name: 'canBurn', description: 'Filter by property canCreate (boolean)', required: false })
  @ApiQuery({ name: 'canAddQuantity', description: 'Filter by property canAddQuantity (boolean)', required: false })
  @ApiQuery({ name: 'withNfts', description: 'Return additional nfts', required: false })
  @ApiQuery({ name: 'nftSize', description: 'Maximum number of nfts per collection entry', required: false })
  @ApiQuery({ name: 'source', description: 'Data source of request', required: false })
  @ApiResponse({
    status: 200,
    description: 'The token collections of a given account',
    type: NftCollectionAccount,
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getAccountCollections(
    @Param('address', ParseAddressPipe) address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('type', new ParseOptionalEnumPipe(NftType)) type?: NftType,
    @Query('canCreate', new ParseOptionalBoolPipe) canCreate?: boolean,
    @Query('canBurn', new ParseOptionalBoolPipe) canBurn?: boolean,
    @Query('canAddQuantity', new ParseOptionalBoolPipe) canAddQuantity?: boolean,
    @Query('source', new ParseOptionalEnumPipe(EsdtDataSource)) source?: EsdtDataSource,
  ): Promise<NftCollectionAccount[]> {
    try {
      return await this.collectionService.getCollectionsForAddress(address, { search, type, canCreate, canBurn, canAddQuantity }, { from, size }, source);
    } catch (error) {
      this.logger.error(`Error in getAccountCollections for address ${address}`);
      this.logger.error(error);
      // throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      return [];
    }
  }

  @Get("/accounts/:address/collections/count")
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'owner', description: 'Filter by collection owner', required: false })
  @ApiQuery({ name: 'canCreate', description: 'Filter by property canCreate (boolean)', required: false })
  @ApiQuery({ name: 'canBurn', description: 'Filter by property canCreate (boolean)', required: false })
  @ApiQuery({ name: 'canAddQuantity', description: 'Filter by property canAddQuantity (boolean)', required: false })
  @ApiResponse({
    status: 200,
    description: 'The number of token collections available on the blockchain for the given address',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getCollectionCount(
    @Param('address', ParseAddressPipe) address: string,
    @Query('search') search?: string,
    @Query('type', new ParseOptionalEnumPipe(NftType)) type?: NftType,
    @Query('owner', ParseAddressPipe) owner?: string,
    @Query('canCreate', new ParseOptionalBoolPipe) canCreate?: boolean,
    @Query('canBurn', new ParseOptionalBoolPipe) canBurn?: boolean,
    @Query('canAddQuantity', new ParseOptionalBoolPipe) canAddQuantity?: boolean,
  ): Promise<number> {
    try {
      return await this.collectionService.getCollectionCountForAddress(address, { search, type, owner, canCreate, canBurn, canAddQuantity });
    } catch (error) {
      this.logger.error(`Error in getCollectionCount for address ${address}`);
      this.logger.error(error);
      // throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      return 0;
    }
  }

  @Get("/accounts/:address/collections/c")
  @ApiExcludeEndpoint()
  async getCollectionCountAlternative(
    @Param('address', ParseAddressPipe) address: string,
    @Query('search') search?: string,
    @Query('type', new ParseOptionalEnumPipe(NftType)) type?: NftType,
    @Query('owner', ParseAddressPipe) owner?: string,
    @Query('canCreate', new ParseOptionalBoolPipe) canCreate?: boolean,
    @Query('canBurn', new ParseOptionalBoolPipe) canBurn?: boolean,
    @Query('canAddQuantity', new ParseOptionalBoolPipe) canAddQuantity?: boolean,
  ): Promise<number> {
    try {
      return await this.collectionService.getCollectionCountForAddress(address, { search, type, owner, canCreate, canBurn, canAddQuantity });
    } catch (error) {
      this.logger.error(`Error in getCollectionCountAlternative for address ${address}`);
      this.logger.error(error);
      // throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      return 0;
    }
  }

  @Get("/accounts/:address/collections/:collection")
  @ApiResponse({
    status: 200,
    description: 'A specific NFT collection of a given account',
    type: NftAccount,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found',
  })
  async getAccountCollection(
    @Param('address', ParseAddressPipe) address: string,
    @Param('collection') collection: string,
  ): Promise<NftCollectionAccount> {
    const result = await this.collectionService.getCollectionForAddress(address, collection);
    if (!result) {
      throw new NotFoundException('Collection for given account not found');
    }

    return result;
  }

  @Get("/accounts/:address/tokens/:token")
  @ApiResponse({
    status: 200,
    description: 'A specific token of a given account',
    type: TokenWithBalance,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getAccountToken(
    @Param('address', ParseAddressPipe) address: string,
    @Param('token') token: string,
  ): Promise<TokenWithBalance> {
    const result = await this.tokenService.getTokenForAddress(address, token);
    if (!result) {
      throw new HttpException('Token for given account not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  @Get("/accounts/:address/nfts")
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Filter by identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'collection', description: 'Get all tokens by token collection. Deprecated, replaced by collections parameter', required: false, deprecated: true })
  @ApiQuery({ name: 'collections', description: 'Get all tokens by token collections, comma-separated', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false })
  @ApiQuery({ name: 'includeFlagged', description: 'Include NFTs that are flagged or not', required: false })
  @ApiQuery({ name: 'withSupply', description: 'Return supply where type = SemiFungibleESDT', required: false })
  @ApiQuery({ name: 'withMetadata', description: 'Return metadata for nfts', required: false })
  @ApiQuery({ name: 'source', description: 'Data source of request', required: false })
  @ApiResponse({
    status: 200,
    description: 'The non-fungible and semi-fungible tokens of a given account',
    type: NftAccount,
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getAccountNfts(
    @Param('address', ParseAddressPipe) address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('type') type?: NftType,
    @Query('collection') collection?: string,
    @Query('collections', ParseArrayPipe) collections?: string[],
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('hasUris', new ParseOptionalBoolPipe) hasUris?: boolean,
    @Query('includeFlagged', new ParseOptionalBoolPipe) includeFlagged?: boolean,
    @Query('withSupply', new ParseOptionalBoolPipe) withSupply?: boolean,
    @Query('withMetadata', new ParseOptionalBoolPipe) withMetadata?: boolean,
    @Query('source', new ParseOptionalEnumPipe(EsdtDataSource)) source?: EsdtDataSource,
  ): Promise<NftAccount[]> {
    try {
      return await this.nftService.getNftsForAddress(address, { from, size }, { search, identifiers, type, collection, name, collections, tags, creator, hasUris, includeFlagged }, { withSupply, withMetadata }, source);
    } catch (error) {
      this.logger.error(`Error in getAccountNfts for address ${address}`);
      this.logger.error(error);
      return [];
    }
  }

  @Get("/accounts/:address/nfts/count")
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Filter by identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'collection', description: 'Get all tokens by token collection', required: false })
  @ApiQuery({ name: 'collections', description: 'Get all tokens by token collections, comma-separated', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false })
  @ApiQuery({ name: 'includeFlagged', description: 'Include NFTs that are flagged or not', required: false })
  @ApiResponse({
    status: 200,
    description: 'The number of non-fungible and semi-fungible tokens available on the blockchain for the given address',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getNftCount(
    @Param('address', ParseAddressPipe) address: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('search') search?: string,
    @Query('type') type?: NftType,
    @Query('collection') collection?: string,
    @Query('collections', ParseArrayPipe) collections?: string[],
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('hasUris', new ParseOptionalBoolPipe) hasUris?: boolean,
    @Query('includeFlagged', new ParseOptionalBoolPipe) includeFlagged?: boolean,
  ): Promise<number> {
    try {
      return await this.nftService.getNftCountForAddress(address, { search, identifiers, type, collection, collections, name, tags, creator, hasUris, includeFlagged });
    } catch (error) {
      this.logger.error(`Error in getNftCount for address ${address}`);
      this.logger.error(error);
      return 0;
    }
  }

  @Get("/accounts/:address/nfts/c")
  @ApiExcludeEndpoint()
  async getNftCountAlternative(
    @Param('address', ParseAddressPipe) address: string,
    @Query('search') search?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('type') type?: NftType,
    @Query('collection') collection?: string,
    @Query('collections', ParseArrayPipe) collections?: string[],
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('hasUris', new ParseOptionalBoolPipe) hasUris?: boolean,
    @Query('includeFlagged', new ParseOptionalBoolPipe) includeFlagged?: boolean,
  ): Promise<number> {
    try {
      return await this.nftService.getNftCountForAddress(address, { search, identifiers, type, collection, collections, name, tags, creator, hasUris, includeFlagged });
    } catch (error) {
      this.logger.error(`Error in getNftCountAlternative for address ${address}`);
      this.logger.error(error);
      return 0;
    }
  }

  @Get("/accounts/:address/nfts/:nft")
  @ApiResponse({
    status: 200,
    description: 'A specific non-fungible or semi-fungible token of a given account',
    type: NftAccount,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getAccountNft(
    @Param('address', ParseAddressPipe) address: string,
    @Param('nft') nft: string,
  ): Promise<NftAccount> {
    const result = await this.nftService.getNftForAddress(address, nft);
    if (!result) {
      throw new HttpException('Token for given account not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  @Get("/accounts/:address/stake")
  @ApiResponse({
    status: 200,
    description: 'Staking information for a given account',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getAccountStake(@Param('address', ParseAddressPipe) address: string) {
    try {
      return await this.stakeService.getStakeForAddress(address);
    } catch (error) {
      this.logger.error(`Error in getAccountStake for address ${address}`);
      this.logger.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/delegation-legacy")
  @ApiResponse({
    status: 200,
    description: 'The legacy delegation details of a given account',
    type: AccountDelegationLegacy,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getAccountDelegationLegacy(@Param('address', ParseAddressPipe) address: string): Promise<AccountDelegationLegacy> {
    try {
      return await this.delegationLegacyService.getDelegationForAddress(address);
    } catch (error) {
      this.logger.error(`Error in getAccountDelegationLegacy for address ${address}`);
      this.logger.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/keys")
  @ApiResponse({
    status: 200,
    description: 'The key details of a given account',
    type: AccountKey,
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getAccountKeys(@Param('address', ParseAddressPipe) address: string): Promise<AccountKey[]> {
    try {
      return await this.accountService.getKeys(address);
    } catch (error) {
      this.logger.error(`Error in getAccountKeys for address ${address}`);
      this.logger.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/waiting-list")
  @ApiResponse({
    status: 200,
    description: 'The waiting list of a given account',
    type: WaitingList,
    isArray: true,
  })
  async getAccountWaitingList(@Param('address', ParseAddressPipe) address: string): Promise<WaitingList[]> {
    return await this.waitingListService.getWaitingListForAddress(address);
  }

  @Get("/accounts/:address/transactions")
  @ApiResponse({
    status: 200,
    description: 'Transactions history informations for a given account',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Address of the transaction receiver', required: false })
  @ApiQuery({ name: 'token', description: 'Identifier of the token', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid)', required: false })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'withScResults', description: 'Return scResults for transactions', required: false })
  @ApiQuery({ name: 'withOperations', description: 'Return operations for transactions', required: false })
  @ApiQuery({ name: 'withOperations', description: 'Return logs for transactions', required: false })
  async getAccountTransactions(
    @Param('address', ParseAddressPipe) address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('token') token?: string,
    @Query('senderShard', ParseOptionalIntPipe) senderShard?: number,
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('search') search?: string,
    @Query('before', ParseOptionalIntPipe) before?: number,
    @Query('after', ParseOptionalIntPipe) after?: number,
    @Query('order', new ParseOptionalEnumPipe(SortOrder)) order?: SortOrder,
    @Query('withScResults', new ParseOptionalBoolPipe) withScResults?: boolean,
    @Query('withOperations', new ParseOptionalBoolPipe) withOperations?: boolean,
    @Query('withLogs', new ParseOptionalBoolPipe) withLogs?: boolean,
  ) {
    if ((withScResults === true || withOperations === true || withLogs) && size > 50) {
      throw new BadRequestException(`Maximum size of 50 is allowed when activating flags 'withScResults', 'withOperations' or 'withLogs'`);
    }

    try {
      return await this.transactionService.getTransactions({
        sender,
        receiver,
        token,
        senderShard,
        receiverShard,
        miniBlockHash,
        hashes,
        status,
        search,
        before,
        after,
        order,
      }, { from, size }, { withScResults, withOperations, withLogs }, address);
    } catch (error) {
      this.logger.error(`Error in getAccountTransactions for address ${address}`);
      this.logger.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/transactions/count")
  @ApiResponse({
    status: 200,
    description: 'Transactions count history informations for a given account',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Address of the transaction receiver', required: false })
  @ApiQuery({ name: 'token', description: 'Identifier of the token', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid)', required: false })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'function', description: 'Filter transactions by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  async getAccountTransactionsCount(
    @Param('address', ParseAddressPipe) address: string,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('token') token?: string,
    @Query('senderShard', ParseOptionalIntPipe) senderShard?: number,
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('search') search?: string,
    @Query('function') scFunction?: string | undefined,
    @Query('before', ParseOptionalIntPipe) before?: number,
    @Query('after', ParseOptionalIntPipe) after?: number,
  ): Promise<number> {
    return await this.transactionService.getTransactionCount({
      sender,
      receiver,
      token,
      function: scFunction,
      senderShard,
      receiverShard,
      miniBlockHash,
      hashes,
      status,
      search,
      before,
      after,
    }, address);
  }


  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @Get("/accounts/:address/contracts")
  @ApiResponse({
    status: 200,
    description: 'All deployed contracts for a given account',
    type: DeployedContract,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  getAccountContracts(
    @Param('address', ParseAddressPipe) address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<DeployedContract[]> {
    return this.accountService.getAccountContracts({ from, size }, address);
  }

  @Get("/accounts/:address/contracts/count")
  @ApiResponse({
    status: 200,
    description: 'All deployed contracts for a given account',
    type: DeployedContract,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  getAccountContractsCount(@Param('address', ParseAddressPipe) address: string): Promise<number> {
    return this.accountService.getAccountContractsCount(address);
  }

  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @Get("/accounts/:address/sc-results")
  @ApiResponse({
    status: 200,
    description: 'All smart contract results for a given account',
    type: SmartContractResult,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  getAccountScResults(
    @Param('address', ParseAddressPipe) address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<SmartContractResult[]> {
    return this.scResultService.getAccountScResults(address, { from, size });
  }

  @Get("/accounts/:address/sc-results/count")
  @ApiResponse({
    status: 200,
    description: 'The count of all smart contract results for a given account',
    type: SmartContractResult,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  getAccountScResultsCount(
    @Param('address', ParseAddressPipe) address: string,
  ): Promise<SmartContractResult[]> {
    return this.scResultService.getAccountScResultsCount(address);
  }

  @Get("/accounts/:address/sc-results/:scHash")
  @ApiResponse({
    status: 200,
    description: 'The specific smart contract results for a given account',
    type: SmartContractResult,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getAccountScResult(
    @Param('address', ParseAddressPipe) _: string,
    @Param('scHash', ParseTransactionHashPipe) scHash: string,
  ): Promise<SmartContractResult> {
    const scResult = await this.scResultService.getScResult(scHash);
    if (!scResult) {
      throw new NotFoundException('Smart contract result not found');
    }

    return scResult;
  }

  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @Get("/accounts/:address/history")
  @ApiResponse({
    status: 200,
    description: 'The account EGLD balance historical data for given address',
    type: AccountHistory,
  })
  @ApiResponse({
    status: 404,
    description: 'Account EGLD balance history not found',
  })
  getAccountHistory(
    @Param('address', ParseAddressPipe) address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<AccountHistory[]> {
    return this.accountService.getAccountHistory(address, { from, size });
  }

  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @Get("/accounts/:address/history/:tokenIdentifier")
  @ApiResponse({
    status: 200,
    description: 'The token balance history for given address',
    type: AccountEsdtHistory,
  })
  @ApiResponse({
    status: 404,
    description: 'Token balance history not found for this account',
  })
  getAccountTokenHistory(
    @Param('address', ParseAddressPipe) address: string,
    @Param('tokenIdentifier') tokenIdentifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<AccountEsdtHistory[]> {
    return this.accountService.getAccountTokenHistory(address, tokenIdentifier, { from, size });
  }
}
