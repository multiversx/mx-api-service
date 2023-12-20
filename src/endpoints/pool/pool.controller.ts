import { ParseIntPipe, ParseTransactionHashPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PoolService } from "./pool.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TransactionInPool } from "./entities/transaction.in.pool.dto";

@Controller()
@ApiTags('pool')
export class PoolController {
  constructor(
    private readonly poolService: PoolService,
  ) { }

  @Get("/pool")
  @ApiOperation({ summary: 'Transactions pool', description: 'Returns the transactions that are currently in the memory pool.' })
  @ApiOkResponse({ type: [TransactionInPool], isArray: true })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getTransactionPool(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<TransactionInPool[]> {
    return await this.poolService.getPool(new QueryPagination({ from, size }));
  }

  @Get("/pool/:txhash")
  @ApiOperation({ summary: 'Transaction from pool', description: 'Returns a transaction from the memory pool.' })
  @ApiOkResponse({ type: [TransactionInPool] })
  async getTransactionFromPool(
    @Param('txhash', ParseTransactionHashPipe) txHash: string,
  ): Promise<TransactionInPool> {
    const transaction = await this.poolService.getTransactionFromPool(txHash);
    if (transaction === undefined) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }

    return transaction;
  }

}
