import { BadRequestException, Controller, DefaultValuePipe, Get, HttpException, HttpStatus, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionStatus } from "../transactions/entities/transaction.status";
import { TransactionService } from "../transactions/transaction.service";
import { TokenAccount } from "./entities/token.account";
import { TokenDetailed } from "./entities/token.detailed";
import { TokenService } from "./token.service";
import { TokenRoles } from "./entities/token.roles";
import { EsdtSupply } from "../esdt/entities/esdt.supply";
import { Transaction } from "../transactions/entities/transaction";
import { TokenSupplyResult } from "./entities/token.supply.result";
import { TokenSort } from "./entities/token.sort";
import { SortTokens } from "src/common/entities/sort.tokens";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { TransferService } from "../transfers/transfer.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TokenFilter } from "./entities/token.filter";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { TransactionQueryOptions } from "../transactions/entities/transactions.query.options";
import { ParseAddressPipe, ParseBlockHashPipe, ParseOptionalBoolPipe, ParseOptionalEnumPipe, ParseOptionalIntPipe, ParseArrayPipe, ParseTokenPipe } from "@elrondnetwork/erdnest";

@Controller()
@ApiTags('tokens')
export class TokenController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly transactionService: TransactionService,
    private readonly apiConfigService: ApiConfigService,
    private readonly transferService: TransferService,
  ) { }

  @Get("/tokens")
  @ApiOperation({ summary: 'Tokens', description: 'Returns all tokens available on the blockchain' })
  @ApiOkResponse({ type: [TokenDetailed] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'name', description: 'Search by token name', required: false })
  @ApiQuery({ name: 'identifier', description: 'Search by token identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by multiple token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'sort', description: 'Sorting criteria', required: false, enum: SortTokens })
  @ApiQuery({ name: 'order', description: 'Sorting order (asc / desc)', required: false, enum: SortOrder })
  async getTokens(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('identifier', ParseTokenPipe) identifier?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('sort', new ParseOptionalEnumPipe(TokenSort)) sort?: TokenSort,
    @Query('order', new ParseOptionalEnumPipe(SortOrder)) order?: SortOrder,
  ): Promise<TokenDetailed[]> {
    return await this.tokenService.getTokens(
      new QueryPagination({ from, size }),
      new TokenFilter({ search, name, identifier, identifiers, sort, order })
    );
  }

  @Get("/tokens/count")
  @ApiOperation({ summary: 'Tokens count', description: 'Return total number of tokens available on blockchain' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'name', description: 'Search by token name', required: false })
  @ApiQuery({ name: 'identifier', description: 'Search by token identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by multiple token identifiers, comma-separated', required: false })
  async getTokenCount(
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('identifier') identifier?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
  ): Promise<number> {
    return await this.tokenService.getTokenCount(new TokenFilter({ search, name, identifier, identifiers }));
  }

  @Get("/tokens/c")
  @ApiExcludeEndpoint()
  async getTokenCountAlternative(
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('identifier', ParseTokenPipe) identifier?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
  ): Promise<number> {
    return await this.tokenService.getTokenCount(new TokenFilter({ search, name, identifier, identifiers }));
  }

  @Get('/tokens/:identifier')
  @ApiOperation({ summary: 'Token', description: 'Returns token details based on a specific token identifier' })
  @ApiOkResponse({ type: TokenDetailed })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getToken(
    @Param('identifier', ParseTokenPipe) identifier: string
  ): Promise<TokenDetailed> {
    const token = await this.tokenService.getToken(identifier);
    if (token === undefined) {
      throw new NotFoundException('Token not found');
    }

    return token;
  }

  @Get('/tokens/:identifier/supply')
  @ApiOperation({ summary: 'Token supply', description: 'Returns general supply information for a specific token' })
  @ApiQuery({ name: 'denominated', description: 'Return results denominated', required: false })
  @ApiOkResponse({ type: EsdtSupply })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getTokenSupply(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('denominated', new ParseOptionalBoolPipe) denominated?: boolean,
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
  @ApiOperation({ summary: 'Token accounts', description: 'Returns a list of accounts that hold a specific token' })
  @ApiOkResponse({ type: [TokenAccount] })
  @ApiNotFoundResponse({ description: 'Token not found' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getTokenAccounts(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<TokenAccount[]> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    const accounts = await this.tokenService.getTokenAccounts(new QueryPagination({ from, size }), identifier);
    if (!accounts) {
      throw new NotFoundException('Token not found');
    }

    return accounts;
  }

  @Get("/tokens/:identifier/accounts/count")
  @ApiOperation({ summary: 'Token accounts count', description: 'Returns the total number of accounts that hold a specific token' })
  @ApiOkResponse({ type: Number })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getTokenAccountsCount(
    @Param('identifier', ParseTokenPipe) identifier: string,
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
  @ApiOperation({ summary: 'Token transactions', description: `Returns a list of transactions for a specific token. Maximum size of 50 is allowed when activating flags withScResults, withOperation or withLogs` })
  @ApiOkResponse({ type: [Transaction] })
  @ApiNotFoundResponse({ description: 'Token not found' })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Address of the transaction receiver', required: false })
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
  async getTokenTransactions(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('senderShard', ParseOptionalIntPipe) senderShard?: number,
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('search') search?: string,
    @Query('function') scFunction?: string,
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

    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    return await this.transactionService.getTransactions(new TransactionFilter({
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
    }), new QueryPagination({ from, size }), new TransactionQueryOptions({ withScResults, withOperations, withLogs }));
  }

  @Get("/tokens/:identifier/transactions/count")
  @ApiOperation({ summary: 'Token transactions count', description: 'Returns the total number of transactions for a specific token' })
  @ApiOkResponse({ type: Number })
  @ApiNotFoundResponse({ description: 'Token not found' })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Address of the transaction receiver', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  async getTokenTransactionsCount(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('senderShard', ParseOptionalIntPipe) senderShard?: number,
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('search') search?: string,
    @Query('before', ParseOptionalIntPipe) before?: number,
    @Query('after', ParseOptionalIntPipe) after?: number,
  ) {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    return await this.transactionService.getTransactionCount(new TransactionFilter({
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
    }));
  }

  @Get("/tokens/:identifier/roles")
  @ApiOperation({ summary: 'Token roles', description: 'Returns a list of accounts that can perform various actions on a specific token' })
  @ApiOkResponse({ type: [TokenRoles] })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getTokenRoles(
    @Param('identifier', ParseTokenPipe) identifier: string,
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
  @ApiOperation({ summary: 'Token address roles', description: 'Returns roles detalils for a specific address of a given token' })
  @ApiOkResponse({ type: TokenRoles })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getTokenRolesForAddress(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Param('address', ParseAddressPipe) address: string,
  ): Promise<TokenRoles> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    const roles = await this.tokenService.getTokenRolesForIdentifierAndAddress(identifier, address);
    if (!roles) {
      throw new NotFoundException('Token not found');
    }

    return roles;
  }

  @Get("/tokens/:identifier/transfers")
  @ApiOperation({ summary: 'Token value transfers', description: 'Returns both transfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult), thus providing a full picture of all in/out value transfers for a given account' })
  @ApiOkResponse({ type: [Transaction] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'sender', description: 'Address of the transfer sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Address of the transfer receiver', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transfer hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  async getTokenTransfers(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('senderShard', ParseOptionalIntPipe) senderShard?: number,
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('search') search?: string,
    @Query('before', ParseOptionalIntPipe) before?: number,
    @Query('after', ParseOptionalIntPipe) after?: number,
    @Query('order', new ParseOptionalEnumPipe(SortOrder)) order?: SortOrder,
  ): Promise<Transaction[]> {
    if (!this.apiConfigService.getIsIndexerV3FlagActive()) {
      throw new HttpException('Endpoint not live yet', HttpStatus.NOT_IMPLEMENTED);
    }

    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    return await this.transferService.getTransfers(new TransactionFilter({
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
      order,
    }), new QueryPagination({ from, size }));
  }

  @Get("/tokens/:identifier/transfers/count")
  @ApiOperation({ summary: 'Account transfer count', description: 'Return total count of tranfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult)' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'sender', description: 'Address of the transfer sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Address of the transfer receiver', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transfer hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'function', description: 'Filter transfers by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  async getTokenTransfersCount(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('senderShard', ParseOptionalIntPipe) senderShard?: number,
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('search') search?: string,
    @Query('function') scFunction?: string,
    @Query('before', ParseOptionalIntPipe) before?: number,
    @Query('after', ParseOptionalIntPipe) after?: number,
  ): Promise<number> {
    if (!this.apiConfigService.getIsIndexerV3FlagActive()) {
      throw new HttpException('Endpoint not live yet', HttpStatus.NOT_IMPLEMENTED);
    }

    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    return await this.transferService.getTransfersCount(new TransactionFilter({
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
    }));
  }

  @Get("/tokens/:identifier/transfers/c")
  @ApiExcludeEndpoint()
  async getAccountTransfersCountAlternative(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('senderShard', ParseOptionalIntPipe) senderShard?: number,
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('search') search?: string,
    @Query('function') scFunction?: string,
    @Query('before', ParseOptionalIntPipe) before?: number,
    @Query('after', ParseOptionalIntPipe) after?: number,
  ): Promise<number> {
    if (!this.apiConfigService.getIsIndexerV3FlagActive()) {
      throw new HttpException('Endpoint not live yet', HttpStatus.NOT_IMPLEMENTED);
    }

    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    return await this.transferService.getTransfersCount(new TransactionFilter({
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
    }));
  }
}
