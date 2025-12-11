import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TransactionService } from '../../endpoints/transactions/transaction.service';
import { TransactionFilter } from '../../endpoints/transactions/entities/transaction.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { UseFilters, UseGuards } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { TransactionCustomSubscribePayload } from 'src/endpoints/transactions/entities/dtos/transaction.custom.subscribe';
import { WsSubscriptionLimiterGuard } from 'src/utils/ws.subscription.limiter';
import { RoomKeyGenerator } from './room.key.generator';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import { Lock } from '@multiversx/sdk-nestjs-common';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class TransactionsCustomGateway {
  private readonly logger = new OriginLogger(TransactionsCustomGateway.name);
  static keyPrefix = 'custom-tx-';
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly transactionService: TransactionService,
  ) { }

  @Lock({ name: 'Subscription lock', verbose: true })
  @UseGuards(WsSubscriptionLimiterGuard)
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

  async pushTransactionsForTimestampMs(timestampMs: number): Promise<void> {
    try {
      const allTransactions = await this.transactionService.getTransactions(
        new TransactionFilter({ before: timestampMs, after: timestampMs }),
        new QueryPagination({ size: 10000 }) // TODO: handle pagination with more than 10k txs
      );

      const txFilteredForBroadcast: Map<string, Transaction[]> = new Map();
      for (const transaction of allTransactions) {
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

      for (const [roomName] of txFilteredForBroadcast) {
        this.server.to(roomName).emit("customTransactionUpdate", { transactions: txFilteredForBroadcast.get(roomName), timestampMs });
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

}
