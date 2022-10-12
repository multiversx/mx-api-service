import { AddressUtils } from "@elrondnetwork/erdnest";
import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Injectable } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionActionService } from "src/endpoints/transactions/transaction-action/transaction.action.service";

@Injectable()
@WebSocketGateway(3099)
export class WebSocketPublisherService {
  private readonly maxAddressesSize = 16;

  @WebSocketServer()
  server: Server | undefined;

  constructor(
    private readonly transactionActionService: TransactionActionService
  ) { }

  async handleDisconnect(socket: Socket) {
    const { addresses, error } = this.getAddressesFromSocketQuery(socket);
    if (error) {
      socket.emit('error', error);
      return;
    }

    for (const address of addresses) {
      await socket.leave(address);
    }
  }

  async handleConnection(socket: Socket) {
    const { addresses, error } = this.getAddressesFromSocketQuery(socket);
    if (error) {
      socket.emit('error', error);
      return;
    }

    await socket.join(addresses);
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

  private getAddressesFromSocketQuery(socket: Socket): { addresses: string[], error?: string } {
    const rawAddresses = socket.handshake.query.address as string | undefined;
    if (!rawAddresses) {
      return { addresses: [], error: 'Validation failed (an address is expected)' };
    }

    const addresses = rawAddresses.split(',');
    if (addresses.length > this.maxAddressesSize) {
      return { addresses: [], error: `Validation failed for 'address' (less than ${this.maxAddressesSize} comma separated values expected)` };
    }

    const distinctAddresses = addresses.distinct();
    for (const address of distinctAddresses) {
      if (!AddressUtils.isAddressValid(address)) {
        return { addresses: [], error: `Validation failed for 'address' (a bech32 address is expected)` };
      }
    }

    return { addresses: distinctAddresses };
  }
}
