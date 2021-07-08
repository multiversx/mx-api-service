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
import { NftAccount } from '../tokens/entities/nft.account';
import { ParseOptionalEnumPipe } from 'src/helpers/pipes/parse.optional.enum.pipe';
import { NftType } from '../tokens/entities/nft.type';
import { ParseOptionalBoolPipe } from 'src/helpers/pipes/parse.optional.bool.pipe';

@Controller()
@ApiTags('accounts')
export class AccountController {
  private readonly logger: Logger

  constructor(
    private readonly accountService: AccountService,
    private readonly tokenService: TokenService,
    private readonly delegationLegacyService: DelegationLegacyService
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
    return this.accountService.getAccounts(from, size);
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
    try {
      return await this.accountService.getAccount(address);
    } catch {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
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
    } catch {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/tokens")
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false  })
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
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<TokenWithBalance[]> {
    try {
      return await this.tokenService.getTokensForAddress(address, from, size);
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
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  @Get("/accounts/:address/nfts")
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false  })
	@ApiQuery({ name: 'search', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT)', required: false })
	@ApiQuery({ name: 'collection', description: 'Get all tokens by token collection', required: false })
	@ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
	@ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
	@ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false })
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
		@Query('search') search: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('collection') collection: string | undefined,
		@Query('tags') tags: string | undefined,
		@Query('creator') creator: string | undefined,
		@Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
  ): Promise<NftAccount[]> {
    try {
      return await this.tokenService.getNftsForAddress(address, from, size, { search, type, collection, tags, creator, hasUris });
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  @Get("/accounts/:address/nfts/count")
	@ApiQuery({ name: 'search', description: 'Search by token name', required: false })
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
		@Query('search') search: string | undefined,
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('collection') collection: string | undefined,
		@Query('tags') tags: string | undefined,
		@Query('creator') creator: string | undefined,
		@Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
    ): Promise<number> {
    try {
      return await this.tokenService.getNftCountForAddress(address, { search, type, collection, tags, creator, hasUris });
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
		@Query('type', new ParseOptionalEnumPipe(NftType)) type: NftType | undefined,
		@Query('collection') collection: string | undefined,
		@Query('tags') tags: string | undefined,
		@Query('creator') creator: string | undefined,
		@Query('hasUris', new ParseOptionalBoolPipe) hasUris: boolean | undefined,
    ): Promise<number> {
    try {
      return await this.tokenService.getNftCountForAddress(address, { search, type, collection, tags, creator, hasUris });
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
    let result = await this.tokenService.getNftForAddress(address, nft);
    if (!result) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
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
      return await this.tokenService.getStakeForAddress(address);
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
}
