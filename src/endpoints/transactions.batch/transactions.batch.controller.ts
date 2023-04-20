import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post, Headers } from "@nestjs/common";
import { TransactionBatchSimplified } from "./entities/transaction.batch.simplified";
import { TransactionBatchSimplifiedResult } from "./entities/transaction.batch.simplified.result";
import { TransactionsBatchService } from "./transactions.batch.service";
import { ParseAddressPipe } from "@multiversx/sdk-nestjs-common";

@Controller()
export class TransactionsBatchController {
  private readonly logger: Logger;

  constructor(
    private readonly transactionsBatchService: TransactionsBatchService,
  ) {
    this.logger = new Logger(TransactionsBatchController.name);
  }

  @Post('/batch')
  async startTransactionBatch(
    @Body() batch: TransactionBatchSimplified,
    @Headers() headers: any,
  ): Promise<TransactionBatchSimplifiedResult> {
    const transactionBatch = this.transactionsBatchService.convertToTransactionBatch(batch);
    const address = transactionBatch.groups[0].items[0].transaction.tx.sender;

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

  @Get('/batch/:address/:id')
  async getTransactionBatch(
    @Param('address', ParseAddressPipe) address: string,
    @Param('id') batchId: string,
  ): Promise<TransactionBatchSimplifiedResult> {
    const batch = await this.transactionsBatchService.getTransactionBatch(address, batchId);
    if (!batch) {
      throw new HttpException('Transaction batch not found', HttpStatus.NOT_FOUND);
    }

    return this.transactionsBatchService.convertFromTransactionBatch(batch);
  }

  @Get('/batch/:address')
  async getTransactionBatches(
    @Param('address', ParseAddressPipe) address: string,
  ): Promise<TransactionBatchSimplifiedResult[]> {
    const batches = await this.transactionsBatchService.getTransactionBatches(address);

    return batches.map(batch => this.transactionsBatchService.convertFromTransactionBatch(batch));
  }
}
