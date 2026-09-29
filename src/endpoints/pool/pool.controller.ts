import { ParseAddressAndMetachainPipe, ParseAddressPipe, ParseEnumPipe, ParseIntPipe, ParseTransactionHashPipe, ParseArrayPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, DefaultValuePipe, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiExtraModels, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { PoolService } from "./pool.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TransactionInPool } from "./entities/transaction.in.pool.dto";
import { TransactionType } from "../transactions/entities/transaction.type";
import { PoolFilter } from "./entities/pool.filter";
import { ParseArrayPipeOptions } from "@multiversx/sdk-nestjs-common/lib/pipes/entities/parse.array.options";
import { TransactionPoolTooLarge } from "./entities/transaction.pool.too.large";
import { TransactionPoolTooLargeError } from "./entities/transaction.pool.too.large.error";

@Controller()
@ApiTags('pool')
@ApiExtraModels(TransactionInPool, TransactionPoolTooLarge)
export class PoolController {
  constructor(
    private readonly poolService: PoolService,
  ) { }

  // a pool too large to be read is not an error for the clients, which show that instead of its content
  private async unlessTooLarge<T>(getResult: () => Promise<T>): Promise<T | TransactionPoolTooLarge> {
    try {
      return await getResult();
    } catch (error) {
      if (error instanceof TransactionPoolTooLargeError) {
        return new TransactionPoolTooLarge();
      }

      throw error;
    }
  }

  @Get("/pool")
  @ApiOperation({ summary: 'Transactions pool', description: 'Returns the transactions that are currently in the memory pool.' })
  @ApiOkResponse({
    description: 'The transactions, or TransactionPoolTooLarge when the pool is too large to be displayed',
    schema: { oneOf: [{ type: 'array', items: { $ref: getSchemaPath(TransactionInPool) } }, { $ref: getSchemaPath(TransactionPoolTooLarge) }] },
  })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'sender', description: 'Search in transaction pool by a specific sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search in transaction pool by a specific receiver', required: false })
  @ApiQuery({ name: 'senderShard', description: 'The shard of the sender', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'The shard of the receiver', required: false })
  @ApiQuery({ name: 'type', description: 'Search in transaction pool by type', required: false })
  @ApiQuery({ name: 'function', description: 'Filter transactions by function name', required: false })

  async getTransactionPool(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressAndMetachainPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('type', new ParseEnumPipe(TransactionType)) type?: TransactionType,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
  ): Promise<TransactionInPool[] | TransactionPoolTooLarge> {
    return await this.unlessTooLarge(() => this.poolService.getPool(new QueryPagination({ from, size }), new PoolFilter({
      sender: sender,
      receiver: receiver,
      senderShard: senderShard,
      receiverShard: receiverShard,
      type: type,
      functions: functions,
    })));
  }

  @Get("/pool/count")
  @ApiOperation({ summary: 'Transactions pool count', description: 'Returns the number of transactions that are currently in the memory pool.' })
  @ApiOkResponse({
    description: 'The count, or TransactionPoolTooLarge when it needs the pool and the pool is too large to be read',
    schema: { oneOf: [{ type: 'number' }, { $ref: getSchemaPath(TransactionPoolTooLarge) }] },
  })
  @ApiQuery({ name: 'sender', description: 'Returns the number of transactions with a specific sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search in transaction pool by a specific receiver', required: false })
  @ApiQuery({ name: 'senderShard', description: 'The shard of the sender', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'The shard of the receiver', required: false })
  @ApiQuery({ name: 'type', description: 'Returns the number of transactions with a specific type', required: false })
  async getTransactionPoolCount(
    @Query('sender', ParseAddressAndMetachainPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('type', new ParseEnumPipe(TransactionType)) type?: TransactionType,
  ): Promise<number | TransactionPoolTooLarge> {
    return await this.unlessTooLarge(() => this.poolService.getPoolCount(new PoolFilter({
      sender: sender,
      receiver: receiver,
      senderShard: senderShard,
      receiverShard: receiverShard,
      type: type,
    })));
  }

  @Get("/pool/c")
  @ApiExcludeEndpoint()
  async getTransactionPoolCountAlternative(
    @Query('sender', ParseAddressAndMetachainPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('type', new ParseEnumPipe(TransactionType)) type?: TransactionType,
  ): Promise<number | TransactionPoolTooLarge> {
    return await this.unlessTooLarge(() => this.poolService.getPoolCount(new PoolFilter({ sender, receiver, type })));
  }

  @Get("/pool/:txhash")
  @ApiOperation({ summary: 'Transaction from pool', description: 'Returns a transaction from the memory pool.' })
  @ApiOkResponse({
    description: 'The transaction, or TransactionPoolTooLarge when the pool is too large to be searched',
    schema: { oneOf: [{ $ref: getSchemaPath(TransactionInPool) }, { $ref: getSchemaPath(TransactionPoolTooLarge) }] },
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async getTransactionFromPool(
    @Param('txhash', ParseTransactionHashPipe) txHash: string,
  ): Promise<TransactionInPool | TransactionPoolTooLarge> {
    const transaction = await this.unlessTooLarge(() => this.poolService.getTransactionFromPool(txHash));
    if (transaction === undefined) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}
