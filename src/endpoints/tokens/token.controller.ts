import { BadRequestException, Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Logger, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
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

@Controller()
@ApiTags('tokens')
export class TokenController {
  private readonly logger: Logger;
  constructor(
    private readonly tokenService: TokenService,
    private readonly transactionService: TransactionService,
  ) {
    this.logger = new Logger(TokenController.name);
  }

  @Get("/tokens")
  @ApiResponse({
    status: 200,
    description: 'The list of tokens available on the blockchain',
    type: TokenDetailed,
    isArray: true,
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
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
  @ApiResponse({
    status: 200,
    description: 'The number of tokens available on the blockchain',
  })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'name', description: 'Search by token name', required: false })
  @ApiQuery({ name: 'identifier', description: 'Search by token identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by multiple token identifiers, comma-separated', required: false })
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
  @ApiResponse({
    status: 200,
    description: 'Token details',
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
  @ApiResponse({
    status: 200,
    description: 'Non-fungible / semi-fungible token supply',
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getTokenSupply(@Param('identifier') identifier: string): Promise<{ supply: string, circulatingSupply: string }> {
    const getSupplyResult = await this.tokenService.getTokenSupply(identifier);
    if (!getSupplyResult) {
      throw new NotFoundException();
    }

    return getSupplyResult;
  }

  @Get("/tokens/:identifier/accounts")
  @ApiResponse({
    status: 200,
    description: 'The specific token accounts available on the blockchain',
    type: TokenAccount,
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getTokenAccounts(
    @Param('identifier') identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<TokenAccount[]> {
    const accounts = await this.tokenService.getTokenAccounts({ from, size }, identifier);
    if (!accounts) {
      throw new NotFoundException('Token not found');
    }

    return accounts;
  }

  @Get("/tokens/:identifier/accounts/count")
  @ApiResponse({
    status: 200,
    description: 'The number of specific token accounts available on the blockchain',
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getTokenAccountsCount(
    @Param('identifier') identifier: string,
  ): Promise<number> {
    const count = await this.tokenService.getTokenAccountsCount(identifier);
    if (count === undefined) {
      throw new NotFoundException('Token not found');
    }

    return count;
  }

  @Get("/tokens/:identifier/transactions")
  @ApiResponse({
    status: 200,
    description: 'The specific token transactions history on the blockchain',
    isArray: true,
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
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
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

    try {
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
    } catch (error) {
      this.logger.error(error);
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/tokens/:identifier/transactions/count")
  @ApiResponse({
    status: 200,
    description: 'The specific token transactions count on the blockchain',
    isArray: true,
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
    try {
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
    } catch (error) {
      this.logger.error(error);
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get("/tokens/:identifier/roles")
  @ApiResponse({
    status: 200,
    description: 'Roles of every address to a specific ESDT',
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getTokenRoles(
    @Param('identifier') identifier: string,
  ): Promise<TokenRoles[]> {
    const token = await this.getToken(identifier);
    if (!token) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    const roles = await this.tokenService.getTokenRoles(identifier);
    if (!roles) {
      throw new HttpException('Token roles not found', HttpStatus.NOT_FOUND);
    }

    return roles;
  }

  @Get("/tokens/:identifier/roles/:address")
  @ApiResponse({
    status: 200,
    description: 'Roles for a specific address to a specific ESDT',
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getTokenRolesForAddress(
    @Param('identifier') identifier: string,
    @Param('address') address: string,
  ): Promise<TokenRoles> {
    const roles = await this.tokenService.getTokenRolesForAddress(identifier, address);

    if (!roles) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    return roles;
  }
}
