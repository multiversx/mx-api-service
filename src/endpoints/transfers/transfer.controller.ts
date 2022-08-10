import { ParseAddressPipe, ParseBlockHashPipe, ParseOptionalEnumPipe, ParseOptionalIntPipe, ParseArrayPipe } from "@elrondnetwork/erdnest";
import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { SortOrder } from "src/common/entities/sort.order";
import { Transaction } from "../transactions/entities/transaction";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { TransactionStatus } from "../transactions/entities/transaction.status";
import { TransferService } from "./transfer.service";

@Controller()
@ApiTags('transfers')
export class TransferController {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly transferService: TransferService,
  ) { }

  @Get("/transfers")
  @ApiOperation({ summary: 'Value transfers', description: 'Returns both transfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult), thus providing a full picture of all in/out value transfers for a given account' })
  @ApiOkResponse({ type: [Transaction] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'sender', description: 'Address of the transfer sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Address of the transfer receiver', required: false })
  @ApiQuery({ name: 'receivers', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'token', description: 'Identifier of the token', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transfer hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  async getAccountTransfers(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('receivers', ParseArrayPipe) receivers?: string[],
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
  ): Promise<Transaction[]> {
    if (!this.apiConfigService.getIsIndexerV3FlagActive()) {
      throw new HttpException('Endpoint not live yet', HttpStatus.NOT_IMPLEMENTED);
    }

    return await this.transferService.getTransfers(new TransactionFilter({
      sender,
      receiver,
      receivers,
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
    }), new QueryPagination({ from, size }));
  }

  @Get("/transfers/count")
  @ApiOperation({ summary: 'Account transfer count', description: 'Return total count of tranfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult)' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'sender', description: 'Address of the transfer sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Address of the transfer receiver', required: false })
  @ApiQuery({ name: 'receivers', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'token', description: 'Identifier of the token', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transfer hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'function', description: 'Filter transfers by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  async getAccountTransfersCount(
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('receivers', ParseArrayPipe) receivers?: string[],
    @Query('token') token?: string,
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

    return await this.transferService.getTransfersCount(new TransactionFilter({
      sender,
      receiver,
      receivers,
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
    }));
  }

  @Get("/transfers/c")
  @ApiExcludeEndpoint()
  async getAccountTransfersCountAlternative(
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('receivers', ParseArrayPipe) receivers?: string[],
    @Query('token') token?: string,
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

    return await this.transferService.getTransfersCount(new TransactionFilter({
      sender,
      receiver,
      receivers,
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
    }));
  }
}
