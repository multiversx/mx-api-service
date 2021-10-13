import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Logger, Param, ParseIntPipe, Query } from '@nestjs/common';
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
import { NftCollectionAccount } from '../nfts/entities/nft.collection.account';

@Controller()
@ApiTags('accounts')
export class AccountController {
  private readonly logger: Logger

  constructor(
    private readonly accountService: AccountService,
    private readonly tokenService: TokenService,
    private readonly nftService: NftService,
    private readonly delegationLegacyService: DelegationLegacyService,
    private readonly waitingListService: WaitingListService,
    private readonly stakeService: StakeService,
  ) {
    this.logger = new Logger(AccountController.name);
  }

  @Get("/accounts")
  @ApiResponse({
    status: 200,
    description: 'The accounts available on the blockchain',
    type: Account,
    isArray: true
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false  })
  getAccounts(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<Account[]> {
    return this.accountService.getAccounts({from, size});
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
    type: AccountDetailed
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async getAccountDetails(@Param('address') address: string): Promise<AccountDetailed> {
    let account = await this.accountService.getAccount(address);
    if (!account) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    return account;
  }

  @Get("/accounts/:address/deferred")
  @ApiResponse({
    status: 200,
    description: 'The deferred details of a given account',
    type: AccountDeferred
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async getAccountDeferred(@Param('address') address: string): Promise<AccountDeferred[]> {
    try {
      return await this.accountService.getDeferredAccount(address);
    } catch(error) {
      this.logger.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/tokens")
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by token name / identifier', required: false })
	@ApiQuery({ name: 'name', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'identifier', description: 'Search by token identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'A comma-separated list of identifiers to filter by', required: false })
  @ApiResponse({
    status: 200,
    description: 'The tokens of a given account',
    type: TokenWithBalance,
    isArray: true
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async getAccountTokens(
    @Param('address') address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search: string | undefined,
		@Query('name') name: string | undefined,
		@Query('identifier') identifier: string | undefined,
    @Query('identifiers') identifiers?: string,
  ): Promise<TokenWithBalance[]> {
    try {
      return await this.tokenService.getTokensForAddress(address, { from, size }, { search, name, identifier, identifiers });
    } catch (error) {
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
    description: 'Account not found'
  })
  async getTokenCount(@Param('address') address: string): Promise<number> {
    try {
      return await this.tokenService.getTokenCountForAddress(address);
    } catch (error) {
      this.logger.error(error);
      // throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      return 0;
    }
  }

  @Get("/accounts/:address/tokens/c")
  @ApiExcludeEndpoint()
  async getTokenCountAlternative(@Param('address') address: string): Promise<number> {
    try {
      return await this.tokenService.getTokenCountForAddress(address);
    } catch (error) {
      this.logger.error(error);
      // throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      return 0;
    }
  }

  @Get("/accounts/:address/collections")
	@ApiQuery({ name: 'search', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT)', required: false })
	@ApiQuery({ name: 'canCreate', description: 'Filter by property canCreate (boolean)', required: false })
	@ApiQuery({ name: 'canBurn', description: 'Filter by property canCreate (boolean)', required: false })
	@ApiQuery({ name: 'canAddQuantity', description: 'Filter by property canAddQuantity (boolean)', required: false })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false  })
  @ApiResponse({
    status: 200,
    description: 'The token collections of a given account',
    type: NftCollectionAccount,
    isArray: true
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async getAccountCollections(
    @Param('address') address: string,
		@Query('search') search: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
    @Query('canCreate', new ParseOptionalBoolPipe) canCreate: boolean | undefined,
    @Query('canBurn', new ParseOptionalBoolPipe) canBurn: boolean | undefined,
    @Query('canAddQuantity', new ParseOptionalBoolPipe) canAddQuantity: boolean | undefined,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<NftCollectionAccount[]> {
    try {
      return await this.nftService.getCollectionsForAddress(address, { type, search, canCreate, canBurn, canAddQuantity }, { from, size });
    } catch (error) {
      this.logger.error(error);
      // throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      return [];
    }
  }

  @Get("/accounts/:address/collections/count")
	@ApiQuery({ name: 'search', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT)', required: false })
	@ApiQuery({ name: 'canCreate', description: 'Filter by property canCreate (boolean)', required: false })
	@ApiQuery({ name: 'canBurn', description: 'Filter by property canCreate (boolean)', required: false })
	@ApiQuery({ name: 'canAddQuantity', description: 'Filter by property canAddQuantity (boolean)', required: false })
  @ApiResponse({
    status: 200,
    description: 'The number of token collections available on the blockchain for the given address',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async getCollectionCount(
    @Param('address') address: string,
		@Query('search') search: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
    @Query('canCreate', new ParseOptionalBoolPipe) canCreate: boolean | undefined,
    @Query('canBurn', new ParseOptionalBoolPipe) canBurn: boolean | undefined,
    @Query('canAddQuantity', new ParseOptionalBoolPipe) canAddQuantity: boolean | undefined,
  ): Promise<number> {
    try {
      return await this.nftService.getCollectionCountForAddress(address, { search, type, canCreate, canBurn, canAddQuantity });
    } catch (error) {
      this.logger.error(error);
      // throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      return 0;
    }
  }

  @Get("/accounts/:address/collections/c")
  @ApiExcludeEndpoint()
  async getCollectionCountAlternative(
    @Param('address') address: string,
		@Query('search') search: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
    @Query('canCreate', new ParseOptionalBoolPipe) canCreate: boolean | undefined,
    @Query('canBurn', new ParseOptionalBoolPipe) canBurn: boolean | undefined,
    @Query('canAddQuantity', new ParseOptionalBoolPipe) canAddQuantity: boolean | undefined,
  ): Promise<number> {
    try {
      return await this.nftService.getCollectionCountForAddress(address, { search, type, canCreate, canBurn, canAddQuantity });
    } catch (error) {
      this.logger.error(error);
      // throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      return 0;
    }
  }

  @Get("/accounts/:address/tokens/:token")
  @ApiResponse({
    status: 200,
    description: 'A specific token of a given account',
    type: TokenWithBalance,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found'
  })
  async getAccountToken(
    @Param('address') address: string,
    @Param('token') token: string,
  ): Promise<TokenWithBalance> {
    let result = await this.tokenService.getTokenForAddress(address, token);
    if (!result) {
      throw new HttpException('Token for given account not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  @Get("/accounts/:address/nfts")
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false  })
	@ApiQuery({ name: 'search', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'identifiers', description: 'Filter by identifiers, comma-separated', required: false })
	@ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT)', required: false })
	@ApiQuery({ name: 'collection', description: 'Get all tokens by token collection. Deprecated, replaced by collections parameter', required: false, deprecated: true })
	@ApiQuery({ name: 'collections', description: 'Get all tokens by token collections, comma-separated', required: false })
	@ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
	@ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
	@ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false })
	@ApiQuery({ name: 'withTimestamp', description: 'Add timestamp in the response structure', required: false })
  @ApiQuery({ name: 'withSupply', description: 'Return supply where type = SemiFungibleESDT', required: false })
  @ApiResponse({
    status: 200,
    description: 'The non-fungible and semi-fungible tokens of a given account',
    type: NftAccount,
    isArray: true
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async getAccountNfts(
    @Param('address') address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('identifiers') identifiers?: string,
    @Query('type', new ParseOptionalEnumPipe(NftType)) type?: NftType,
    @Query('collection') collection?: string,
    @Query('collections') collections?: string,
    @Query('tags') tags?: string,
    @Query('creator') creator?: string,
    @Query('hasUris', new ParseOptionalBoolPipe) hasUris?: boolean,
    @Query('withTimestamp', new ParseOptionalBoolPipe) withTimestamp?: boolean,
    @Query('withSupply', new ParseOptionalBoolPipe) withSupply?: boolean,
  ): Promise<NftAccount[]> {
    try {
      return await this.nftService.getNftsForAddress(address, { from, size }, { search, identifiers, type, collection, collections, tags, creator, hasUris }, { withTimestamp, withSupply });
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  @Get("/accounts/:address/nfts/count")
	@ApiQuery({ name: 'search', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'identifiers', description: 'Filter by identifiers, comma-separated', required: false })
	@ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT)', required: false })
	@ApiQuery({ name: 'collection', description: 'Get all tokens by token collection', required: false })
	@ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
	@ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
	@ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false })
  @ApiResponse({
    status: 200,
    description: 'The number of non-fungible and semi-fungible tokens available on the blockchain for the given address',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async getNftCount(
    @Param('address') address: string,
		@Query('identifiers') identifiers: string | undefined,
		@Query('search') search: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('collection') collection: string | undefined,
		@Query('tags') tags: string | undefined,
		@Query('creator') creator: string | undefined,
		@Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
    ): Promise<number> {
    try {
      return await this.nftService.getNftCountForAddress(address, { search, identifiers, type, collection, tags, creator, hasUris });
    } catch (error) {
      this.logger.error(error);
      return 0;
    }
  }

  @Get("/accounts/:address/nfts/c")
  @ApiExcludeEndpoint()
  async getNftCountAlternative(
    @Param('address') address: string,
		@Query('search') search: string | undefined,
		@Query('identifiers') identifiers: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('collection') collection: string | undefined,
		@Query('tags') tags: string | undefined,
		@Query('creator') creator: string | undefined,
		@Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
    ): Promise<number> {
    try {
      return await this.nftService.getNftCountForAddress(address, { search, identifiers, type, collection, tags, creator, hasUris });
    } catch (error) {
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
    description: 'Account not found'
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found'
  })
  async getAccountNft(
    @Param('address') address: string,
    @Param('nft') nft: string,
  ): Promise<NftAccount> {
    let result = await this.nftService.getNftForAddress(address, nft);
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
    description: 'Account not found'
  })
  async getAccountStake(@Param('address') address: string) {
    try {
      return await this.stakeService.getStakeForAddress(address);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/delegation-legacy")
  @ApiResponse({
    status: 200,
    description: 'The legacy delegation details of a given account',
    type: AccountDelegationLegacy
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async getAccountDelegationLegacy(@Param('address') address: string): Promise<AccountDelegationLegacy> {
    try {
      return await this.delegationLegacyService.getDelegationForAddress(address);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/keys")
  @ApiResponse({
    status: 200,
    description: 'The key details of a given account',
    type: AccountKey,
    isArray: true
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async getAccountKeys(@Param('address') address: string): Promise<AccountKey[]> {
    try {
      return await this.accountService.getKeys(address);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/waiting-list")
  @ApiResponse({
    status: 200,
    description: 'The waiting list of a given account',
    type: WaitingList,
    isArray: true
  })
  async getAccountWaitingList(@Param('address') address: string): Promise<WaitingList[]> {
    return await this.waitingListService.getWaitingListForAddress(address);
  }
}
