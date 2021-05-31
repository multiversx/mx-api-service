import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { AccountDetailed } from './entities/account.detailed';
import { Account } from './entities/account';
import { AccountDeferred } from './entities/account.deferred';
import { Token } from '../tokens/entities/token';
import { TokenService } from '../tokens/token.service';
import { TokenWithBalance } from '../tokens/entities/token.with.balance';

@Controller()
@ApiTags('accounts')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly tokenService: TokenService
  ) {}

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
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<TokenWithBalance[]> {
    try {
      return await this.tokenService.getTokensForAddress(address, from, size);
    } catch (error) {
      console.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
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
      console.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/nfts")
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false  })
  @ApiResponse({
    status: 200,
    description: 'The non-fungible and semi-fungible tokens of a given account',
    type: Token,
    isArray: true
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async getAccountNfts(
    @Param('address') address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<Token[]> {
    try {
      return await this.tokenService.getNftsForAddress(address, from, size);
    } catch (error) {
      console.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/accounts/:address/nfts/count")
  @ApiResponse({
    status: 200,
    description: 'The number of non-fungible and semi-fungible tokens available on the blockchain for the given address',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async getNftCount(@Param('address') address: string): Promise<number> {
    try {
      return await this.tokenService.getNftCountForAddress(address);
    } catch (error) {
      console.error(error);
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
  }

  // @Get("/accounts/:address/delegationlegacy")
  // @ApiResponse({
  //   status: 200,
  //   description: 'The legacy delegation details of a given account',
  //   type: AccountDeferred
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: 'Account not found'
  // })
  // async getAccountDelegationLegacy(@Param('address') address: string): Promise<DelegationLegacy> {
  //   try {
  //     return await this.delegationLegacyService.getDelegationForAddress(address);
  //   } catch (error) {
  //     console.error(error);
  //     throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
  //   }
  // }
}
