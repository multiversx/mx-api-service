import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Injectable } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionActionService } from "src/endpoints/transactions/transaction-action/transaction.action.service";

@Injectable()
@WebSocketGateway(3099)
export class WebSocketPublisherService {
  @WebSocketServer()
  server: Server | undefined;

  constructor(
    private readonly transactionActionService: TransactionActionService
  ) { }

  async handleDisconnect(socket: Socket) {
    // @ts-ignore
    const address: string | undefined = socket.handshake.query.address;
    if (!address) {
      return;
    }

    await socket.leave(address);
  }

  async handleConnection(socket: Socket) {
    const address = socket.handshake.query.address;
    if (!address) {
      return;
    }

    await socket.join(address);
  }

  async onTransactionCompleted(transaction: ShardTransaction) {
    await this.emitTransactionEvent(transaction, 'transactionCompleted');
  }

  async onTransactionPendingResults(transaction: ShardTransaction) {
    await this.emitTransactionEvent(transaction, 'transactionPendingResults');
  }

  private async emitTransactionEvent(transaction: ShardTransaction, eventName: string) {
    this.server?.to(transaction.sender).emit(eventName, transaction.hash);

    if (transaction.sender === transaction.receiver) {
      const actionTransaction = new Transaction();
      actionTransaction.sender = transaction.sender;
      actionTransaction.receiver = transaction.receiver;
      actionTransaction.data = transaction.data;
      actionTransaction.value = transaction.value;

      const metadata = await this.transactionActionService.getTransactionMetadata(actionTransaction);
      if (metadata && transaction.sender !== metadata.receiver) {
        this.server?.to(metadata.receiver).emit(eventName, transaction.hash);
      }
    } else {
      this.server?.to(transaction.receiver).emit(eventName, transaction.hash);
    }
  }
}
