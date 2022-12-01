import { Jwt, JwtAuthenticateGuard } from "@elrondnetwork/erdnest";
import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post, UseGuards, Headers } from "@nestjs/common";
import { TransactionBatchSimplified } from "./entities/transaction.batch.simplified";
import { TransactionBatchSimplifiedResult } from "./entities/transaction.batch.simplified.result";
import { TransactionsBatchService } from "./transactions.batch.service";

@Controller()
export class TransactionsBatchController {
  private readonly logger: Logger;

  constructor(
    private readonly transactionsBatchService: TransactionsBatchService,
  ) {
    this.logger = new Logger(TransactionsBatchController.name);
  }

  @Post('/batch')
  @UseGuards(JwtAuthenticateGuard)
  async startTransactionBatch(
    @Body() batch: TransactionBatchSimplified,
    @Headers() headers: any,
    @Jwt('address') address: string,
  ): Promise<TransactionBatchSimplifiedResult> {
    const transactionBatch = this.transactionsBatchService.convertToTransactionBatch(batch);

    const existingBatch = await this.transactionsBatchService.getTransactionBatch(address, transactionBatch.id);
    if (existingBatch) {
      const message = `Duplicate batch detected with id '${transactionBatch.id}' for address ${address}`;
      this.logger.log(message);
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    if (transactionBatch.groups.selectMany(x => x.items).some(x => x.transaction.tx.sender !== address)) {
      const message = `Sender for all transactions should be '${address}'`;
      this.logger.log(message);
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    const sourceIp = headers['x-forwarded-for'] || headers['x-real-ip'];

    const startedBatch = await this.transactionsBatchService.startTransactionBatch(transactionBatch, sourceIp);

    return this.transactionsBatchService.convertFromTransactionBatch(startedBatch);
  }

  @Get('/batch/:id')
  @UseGuards(JwtAuthenticateGuard)
  async getTransactionBatch(
    @Jwt('address') address: string,
    @Param('id') batchId: string,
  ): Promise<TransactionBatchSimplifiedResult> {
    const batch = await this.transactionsBatchService.getTransactionBatch(address, batchId);
    if (!batch) {
      throw new HttpException('Transaction batch not found', HttpStatus.NOT_FOUND);
    }

    return this.transactionsBatchService.convertFromTransactionBatch(batch);
  }

  @Get('/batch')
  @UseGuards(JwtAuthenticateGuard)
  async getTransactionBatches(
    @Jwt('address') address: string,
  ): Promise<TransactionBatchSimplifiedResult[]> {
    const batches = await this.transactionsBatchService.getTransactionBatches(address);

    return batches.map(batch => this.transactionsBatchService.convertFromTransactionBatch(batch));
  }
}
