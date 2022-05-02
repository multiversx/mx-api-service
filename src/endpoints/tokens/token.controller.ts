import { BadRequestException, Controller, DefaultValuePipe, Get, HttpException, HttpStatus, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SortOrder } from "src/common/entities/sort.order";
import { ParseAddressPipe } from "src/utils/pipes/parse.address.pipe";
import { ParseArrayPipe } from "src/utils/pipes/parse.array.pipe";
import { ParseBlockHashPipe } from "src/utils/pipes/parse.block.hash.pipe";
import { ParseOptionalBoolPipe } from "src/utils/pipes/parse.optional.bool.pipe";
import { ParseOptionalEnumPipe } from "src/utils/pipes/parse.optional.enum.pipe";
import { ParseOptionalIntPipe } from "src/utils/pipes/parse.optional.int.pipe";
import { TransactionStatus } from "../transactions/entities/transaction.status";
import { TransactionService } from "../transactions/transaction.service";
import { TokenAccount } from "./entities/token.account";
import { TokenDetailed } from "./entities/token.detailed";
import { TokenService } from "./token.service";
import { TokenRoles } from "./entities/token.roles";
import { EsdtSupply } from "../esdt/entities/esdt.supply";
import { Transaction } from "../transactions/entities/transaction";
import { TokenSupplyResult } from "./entities/token.supply.result";


@Controller()
@ApiTags('tokens')
export class TokenController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly transactionService: TransactionService,
  ) { }

  @Get("/tokens")
  @ApiOperation({
    summary: 'Tokens',
    description: 'Returns a list of tokens as well as a specific token for a given identifier',
  })
  @ApiResponse({
    status: 200,
    isArray: true,
    type: TokenDetailed,
  })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'name', description: 'Search by token name', required: false })
  @ApiQuery({ name: 'identifier', description: 'Search by token identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by multiple token identifiers, comma-separated', required: false })
  async getTokens(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search: string | undefined,
    @Query('name') name: string | undefined,
    @Query('identifier') identifier: string | undefined,
    @Query('identifiers', ParseArrayPipe) identifiers: string[] | undefined,
  ): Promise<TokenDetailed[]> {
    return await this.tokenService.getTokens({ from, size }, { search, name, identifier, identifiers });
  }

  @Get("/tokens/count")
  @ApiOperation({
    summary: 'Tokens count',
    description: 'Return total number of tokens available on blockchain',
  })
  @ApiResponse({
    status: 200,
    type: Number,
  })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'name', description: 'Search by token name', required: false })
  @ApiQuery({ name: 'identifier', description: 'Search by token identifier', required: false })
  @ApiQuery({
    name: 'identifiers',
    description: 'Search by multiple token identifiers, comma-separated',
    required: false,
  })
  async getTokenCount(
    @Query('search') search: string | undefined,
    @Query('name') name: string | undefined,
    @Query('identifier') identifier: string | undefined,
    @Query('identifiers', ParseArrayPipe) identifiers: string[] | undefined,
  ): Promise<number> {
    return await this.tokenService.getTokenCount({ search, name, identifier, identifiers });
  }

  @Get("/tokens/c")
  @ApiExcludeEndpoint()
  async getTokenCountAlternative(
    @Query('search') search: string | undefined,
    @Query('name') name: string | undefined,
    @Query('identifier') identifier: string | undefined,
    @Query('identifiers', ParseArrayPipe) identifiers: string[] | undefined,
  ): Promise<number> {
    return await this.tokenService.getTokenCount({ search, name, identifier, identifiers });
  }

  @Get('/tokens/:identifier')
  @ApiOperation({
    summary: 'Token',
    description: 'Returns token details based on a specific token identifier',
  })
  @ApiResponse({
    status: 200,
    type: TokenDetailed,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getToken(@Param('identifier') identifier: string): Promise<TokenDetailed> {
    const token = await this.tokenService.getToken(identifier);
    if (token === undefined) {
      throw new NotFoundException('Token not found');
    }

    return token;
  }

  @Get('/tokens/:identifier/supply')
  @ApiOperation({
    summary: 'Token supply',
    description: 'Returns supply and circulating supply details for a specific token',
  })
  @ApiQuery({ name: 'denominated', description: 'Return results denominated', required: false })

  @ApiResponse({
    status: 200,
    type: EsdtSupply,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getTokenSupply(
    @Param('identifier') identifier: string,
    @Query('denominated', new ParseOptionalBoolPipe) denominated: boolean | undefined,
  ): Promise<TokenSupplyResult> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    const getSupplyResult = await this.tokenService.getTokenSupply(identifier, denominated);
    if (!getSupplyResult) {
      throw new NotFoundException('Token not found');
    }

    return getSupplyResult;
  }

  @Get("/tokens/:identifier/accounts")
  @ApiOperation({
    summary: 'Token accounts',
    description: 'Returns a list of all accounts that have a specific token',
  })
  @ApiResponse({
    status: 200,
    isArray: true,
    type: TokenAccount,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getTokenAccounts(
    @Param('identifier') identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<TokenAccount[]> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    const accounts = await this.tokenService.getTokenAccounts({ from, size }, identifier);
    if (!accounts) {
      throw new NotFoundException('Token not found');
    }

    return accounts;
  }

  @Get("/tokens/:identifier/accounts/count")
  @ApiOperation({
    summary: 'Token accounts count',
    description: 'Returns the total number of accounts that hold a specific token',
  })
  @ApiResponse({
    status: 200,
    type: Number,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getTokenAccountsCount(
    @Param('identifier') identifier: string,
  ): Promise<number> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    const count = await this.tokenService.getTokenAccountsCount(identifier);
    if (count === undefined) {
      throw new NotFoundException('Token not found');
    }

    return count;
  }

  @Get("/tokens/:identifier/transactions")
  @ApiOperation({
    summary: 'Token transactions',
    description: `Returns a list of transactions for a specific token, it can also return all transactions that have success / pending / fail status and 
    at the same time the transactions on certain shards. Maximum size of 50 is allowed when activating flags withScResults, withOperation or withLogs`,
  })
  @ApiResponse({
    status: 200,
    isArray: true,
    type: Transaction,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Address of the transaction receiver', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / fail)', required: false })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'function', description: 'Filter transactions by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'withScResults', description: 'Return scResults for transactions', required: false })
  @ApiQuery({ name: 'withOperations', description: 'Return operations for transactions', required: false })
  @ApiQuery({ name: 'withLogs', description: 'Return logs for transactions', required: false })
  async getTokenTransactions(
    @Param('identifier') identifier: string,
    @Query('sender', ParseAddressPipe) sender: string | undefined,
    @Query('receiver', ParseAddressPipe) receiver: string | undefined,
    @Query('senderShard', ParseOptionalIntPipe) senderShard: number | undefined,
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard: number | undefined,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash: string | undefined,
    @Query('hashes', ParseArrayPipe) hashes: string[] | undefined,
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status: TransactionStatus | undefined,
    @Query('search') search: string | undefined,
    @Query('function') scFunction: string | undefined,
    @Query('before', ParseOptionalIntPipe) before: number | undefined,
    @Query('after', ParseOptionalIntPipe) after: number | undefined,
    @Query('order', new ParseOptionalEnumPipe(SortOrder)) order: SortOrder | undefined,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('withScResults', new ParseOptionalBoolPipe) withScResults: boolean | undefined,
    @Query('withOperations', new ParseOptionalBoolPipe) withOperations: boolean | undefined,
    @Query('withLogs', new ParseOptionalBoolPipe) withLogs: boolean | undefined,
  ) {
    if ((withScResults === true || withOperations === true || withLogs) && size > 50) {
      throw new BadRequestException(`Maximum size of 50 is allowed when activating flags 'withScResults', 'withOperations' or 'withLogs'`);
    }

    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    return await this.transactionService.getTransactions({
      sender,
      receiver,
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
    }, { from, size }, { withScResults, withOperations, withLogs });
  }

  @Get("/tokens/:identifier/transactions/count")
  @ApiOperation({
    summary: 'Token transactions count',
    description: 'Returns the total number of transactions for a specific token',
  })
  @ApiResponse({
    status: 200,
    type: Number,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Address of the transaction receiver', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid)', required: false })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  async getTokenTransactionsCount(
    @Param('identifier') identifier: string,
    @Query('sender', ParseAddressPipe) sender: string | undefined,
    @Query('receiver', ParseAddressPipe) receiver: string | undefined,
    @Query('senderShard', ParseOptionalIntPipe) senderShard: number | undefined,
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard: number | undefined,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash: string | undefined,
    @Query('hashes', ParseArrayPipe) hashes: string[] | undefined,
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status: TransactionStatus | undefined,
    @Query('search') search: string | undefined,
    @Query('before', ParseOptionalIntPipe) before: number | undefined,
    @Query('after', ParseOptionalIntPipe) after: number | undefined,
  ) {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    return await this.transactionService.getTransactionCount({
      sender,
      receiver,
      token: identifier,
      senderShard,
      receiverShard,
      miniBlockHash,
      hashes,
      status,
      search,
      before,
      after,
    });
  }

  @Get("/tokens/:identifier/roles")
  @ApiOperation({
    summary: 'Token roles',
    description: 'Returns a list of accounts that have certain roles for a specific token',
  })
  @ApiResponse({
    status: 200,
    isArray: true,
    type: TokenRoles,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getTokenRoles(
    @Param('identifier') identifier: string,
  ): Promise<TokenRoles[]> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    const roles = await this.tokenService.getTokenRoles(identifier);
    if (!roles) {
      throw new HttpException('Token roles not found', HttpStatus.NOT_FOUND);
    }

    return roles;
  }

  @Get("/tokens/:identifier/roles/:address")
  @ApiOperation({
    summary: 'Token address roles',
    description: 'Returns the roles of an address for a specific token',
  })
  @ApiResponse({
    status: 200,
    type: TokenRoles,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getTokenRolesForAddress(
    @Param('identifier') identifier: string,
    @Param('address') address: string,
  ): Promise<TokenRoles> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    const roles = await this.tokenService.getTokenRolesForAddress(identifier, address);
    if (!roles) {
      throw new NotFoundException('Token not found');
    }

    return roles;
  }
}
