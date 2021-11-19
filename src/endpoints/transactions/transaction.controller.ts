import { BadRequestException, Body, Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryConditionOptions } from 'src/common/elastic/entities/query.condition.options';
import { ParseAddressPipe } from 'src/utils/pipes/parse.address.pipe';
import { ParseArrayPipe } from 'src/utils/pipes/parse.array.pipe';
import { ParseBlockHashPipe } from 'src/utils/pipes/parse.block.hash.pipe';
import { ParseOptionalBoolPipe } from 'src/utils/pipes/parse.optional.bool.pipe';
import { ParseOptionalEnumPipe } from 'src/utils/pipes/parse.optional.enum.pipe';
import { ParseOptionalIntPipe } from 'src/utils/pipes/parse.optional.int.pipe';
import { ParseTransactionHashPipe } from 'src/utils/pipes/parse.transaction.hash.pipe';
import { Transaction } from './entities/transaction';
import { TransactionCreate } from './entities/transaction.create';
import { TransactionDetailed } from './entities/transaction.detailed';
import { TransactionSendResult } from './entities/transaction.send.result';
import { TransactionStatus } from './entities/transaction.status';
import { TransactionService } from './transaction.service';

@Controller()
@ApiTags('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get("/transactions")
  @ApiResponse({
    status: 200,
    description: 'List transactions',
    type: Transaction,
    isArray: true
  })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false  })
  @ApiQuery({ name: 'receiver', description: 'Address of the transaction receiver', required: false  })
  @ApiQuery({ name: 'token', description: 'Identifier of the token', required: false  })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false  })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false  })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false  })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false  })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid)', required: false  })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false  })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false  })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false  })
  @ApiQuery({ name: 'condition', description: 'Condition for elastic search queries', required: false  })
  @ApiQuery({ name: 'withScResults', description: 'Return results for transactions', required: false })
  @ApiQuery({ name: 'withOperations', description: 'Return operations for transactions', required: false })
  getTransactions(
    @Query('sender', ParseAddressPipe) sender: string | undefined, 
    @Query('receiver', ParseAddressPipe) receiver: string | undefined, 
    @Query('token') token: string | undefined, 
    @Query('senderShard', ParseOptionalIntPipe) senderShard: number | undefined, 
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard: number | undefined, 
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash: string | undefined, 
    @Query('hashes', ParseArrayPipe) hashes: string | undefined, 
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status: TransactionStatus | undefined, 
    @Query('search') search: string | undefined, 
    @Query('condition') condition: QueryConditionOptions | undefined, 
    @Query('before', ParseOptionalIntPipe) before: number | undefined, 
    @Query('after', ParseOptionalIntPipe) after: number | undefined, 
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('withScResults', new ParseOptionalBoolPipe) withScResults: boolean | undefined,
    @Query('withOperations', new ParseOptionalBoolPipe) withOperations: boolean | undefined,
  ): Promise<Transaction[]> {
    return this.transactionService.getTransactions({
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
        condition,
    }, { from, size }, { withScResults, withOperations });
  }

  @Get("/transactions/count")
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Address of the transaction receiver', required: false })
  @ApiQuery({ name: 'token', description: 'Identifier of the token', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid)', required: false })
  @ApiQuery({ name: 'condition', description: 'Condition for elastic search queries', required: false, deprecated: true })
  @ApiQuery({ name: 'search', description: 'Search in data object', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  getTransactionCount(
    @Query('sender', ParseAddressPipe) sender: string | undefined, 
    @Query('receiver', ParseAddressPipe) receiver: string | undefined, 
    @Query('token') token: string | undefined, 
    @Query('senderShard', ParseOptionalIntPipe) senderShard: number | undefined, 
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard: number | undefined, 
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash: string | undefined, 
    @Query('hashes', ParseArrayPipe) hashes: string | undefined, 
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status: TransactionStatus | undefined, 
    @Query('search') search: string | undefined, 
    @Query('condition') condition: QueryConditionOptions | undefined,
    @Query('before', ParseOptionalIntPipe) before: number | undefined, 
    @Query('after', ParseOptionalIntPipe) after: number | undefined, 
  ): Promise<number> {
    return this.transactionService.getTransactionCount({
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
      condition,
    });  
  }

  @Get("/transactions/c")
  @ApiExcludeEndpoint()
  getTransactionCountAlternative(
    @Query('sender', ParseAddressPipe) sender: string | undefined, 
    @Query('receiver', ParseAddressPipe) receiver: string | undefined, 
    @Query('token') token: string | undefined, 
    @Query('senderShard', ParseOptionalIntPipe) senderShard: number | undefined, 
    @Query('receiverShard', ParseOptionalIntPipe) receiverShard: number | undefined, 
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash: string | undefined, 
    @Query('hashes', ParseArrayPipe) hashes: string | undefined, 
    @Query('status', new ParseOptionalEnumPipe(TransactionStatus)) status: TransactionStatus | undefined, 
    @Query('search') search: string | undefined, 
    @Query('condition') condition: QueryConditionOptions | undefined,
    @Query('before', ParseOptionalIntPipe) before: number | undefined, 
    @Query('after', ParseOptionalIntPipe) after: number | undefined, 
  ): Promise<number> {
    return this.transactionService.getTransactionCount({
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
      condition
    });  
  }

  @Get('/transactions/:txHash')
  @ApiResponse({
    status: 200,
    description: 'Transaction details',
    type: TransactionDetailed,
    isArray: true
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found'
  })
  async getTransaction(@Param('txHash', ParseTransactionHashPipe) txHash: string): Promise<TransactionDetailed> {
    let transaction = await this.transactionService.getTransaction(txHash);
    if (transaction === null) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }

    return transaction;
  }

  @Post('/transactions')
  @ApiResponse({
    status: 201,
    description: 'Create a transaction',
    type: TransactionSendResult
  })
  async createTransaction(@Body() transaction: TransactionCreate): Promise<TransactionSendResult> {
    if (!transaction.sender) {
      throw new BadRequestException('Sender must be provided');
    }

    if (!transaction.receiver) {
      throw new BadRequestException('Receiver must be provided');
    }

    let result = await this.transactionService.createTransaction(transaction);

    if (typeof result === 'string' || result instanceof String) {
      throw new HttpException(result, HttpStatus.BAD_REQUEST);
    }

    return result;
  }
}
