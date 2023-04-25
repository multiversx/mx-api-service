import { OriginLogger } from "@multiversx/sdk-nestjs";
import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { WebSocketPublisherService } from "src/common/websockets/web-socket-publisher-service";

@Controller()
export class WebSocketPublisherController {
  private logger = new OriginLogger(WebSocketPublisherController.name);

  constructor(
    private readonly webSocketPublisherService: WebSocketPublisherService,
  ) { }

  @EventPattern('transactionsCompleted')
  async transactionsCompleted(transactions: ShardTransaction[]) {
    for (const transaction of transactions) {
      await this.webSocketPublisherService.onTransactionCompleted(transaction);
    }
  }

  @EventPattern('transactionsPendingResults')
  async transactionsPendingResults(transactions: ShardTransaction[]) {
    for (const transaction of transactions) {
      await this.webSocketPublisherService.onTransactionPendingResults(transaction);
    }
  }

  @EventPattern('onBatchUpdated')
  onBatchUpdated(payload: { address: string, batchId: string, txHashes: string[] }) {
    this.logger.log(`Notifying batch updated for address ${payload.address}, batch id '${payload.batchId}', hashes ${payload.txHashes} `);
    this.webSocketPublisherService.onBatchUpdated(payload.address, payload.batchId, payload.txHashes);
  }
}
