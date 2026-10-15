import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { TransactionCustomSubscribePayload } from 'src/endpoints/transactions/entities/dtos/transaction.custom.subscribe';
import { RoomKeyGenerator } from './room.key.generator';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import { TransactionDetailed } from 'src/endpoints/transactions/entities/transaction.detailed';
import { LockingGuardInterceptor } from 'src/utils/locking.guard.interceptor';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class TransactionsCustomGateway {
  static keyPrefix = 'custom-tx-';
  @WebSocketServer()
  server!: Server;

  @UseInterceptors(LockingGuardInterceptor)
  @SubscribeMessage('subscribeCustomTransactions')
  async handleCustomSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: TransactionCustomSubscribePayload) {

    const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
    if (!client.rooms.has(`${TransactionsCustomGateway.keyPrefix}${filterIdentifier}`)) {
      await client.join(`${TransactionsCustomGateway.keyPrefix}${filterIdentifier}`);
    }
    return { status: 'success' };
  }

  @SubscribeMessage('unsubscribeCustomTransactions')
  async handleCustomUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: TransactionCustomSubscribePayload
  ) {
    const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
    const roomName = `${TransactionsCustomGateway.keyPrefix}${filterIdentifier}`;

    if (client.rooms.has(roomName)) {
      await client.leave(roomName);
    }

    return { status: 'unsubscribed' };
  }

  matchRooms(transactions: TransactionDetailed[]): Map<string, TransactionDetailed[]> {
    const txFilteredForBroadcast: Map<string, TransactionDetailed[]> = new Map();
    for (const transaction of transactions) {
      const roomKeys = RoomKeyGenerator.generate(
        TransactionsCustomGateway.keyPrefix,
        transaction,
        TransactionCustomSubscribePayload,
      );

      for (const roomKey of roomKeys) {
        if (this.server.sockets.adapter.rooms.has(roomKey)) {
          if (!txFilteredForBroadcast.has(roomKey)) {
            txFilteredForBroadcast.set(roomKey, []);
          }
          txFilteredForBroadcast.get(roomKey)!.push(transaction);
        }
      }
    }

    return txFilteredForBroadcast;
  }

  broadcast(timestampMs: number, txFilteredForBroadcast: Map<string, Transaction[]>): void {
    for (const [roomName, transactions] of txFilteredForBroadcast) {
      this.server.to(roomName).emit("customTransactionUpdate", { transactions, timestampMs });
    }
  }
}
