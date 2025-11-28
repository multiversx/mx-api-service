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

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class TransactionsCustomGateway {
  private readonly logger = new OriginLogger(TransactionsCustomGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly transactionService: TransactionService,
  ) { }

  @UseGuards(WsSubscriptionLimiterGuard)
  @SubscribeMessage('subscribeCustomTransactions')
  async handleCustomSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: TransactionCustomSubscribePayload) {

    const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
    await client.join(`custom-tx-${filterIdentifier}`);

    return { status: 'success' };
  }

  async pushTransactionsForTimestampMs(timestampMs: number): Promise<void> {
    try {
      const timestamp = timestampMs / 1000; // TODO: add support for timestampMs
      const allTransactions = await this.transactionService.getTransactions(
        new TransactionFilter({ before: timestamp, after: timestamp }),
        new QueryPagination({ size: 10000 }) // TODO: handle pagination with more than 10k txs
      );

      const txFilteredForBroadcast: Map<string, Transaction[]> = new Map();
      for (const transaction of allTransactions) {
        const roomKeys = RoomKeyGenerator.generate(
          'custom-tx-',
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

      for (const [roomName] of this.server.sockets.adapter.rooms) {
        if (txFilteredForBroadcast.has(roomName)) {
          this.server.to(roomName).emit("customTransactionUpdate", { transactions: txFilteredForBroadcast.get(roomName), timestampMs });
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

}
