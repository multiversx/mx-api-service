import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TransactionService } from '../../endpoints/transactions/transaction.service';
import { TransactionFilter } from '../../endpoints/transactions/entities/transaction.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { TransactionQueryOptions } from '../../endpoints/transactions/entities/transactions.query.options';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { TransactionSubscribePayload } from '../../endpoints/transactions/entities/dtos/transaction.subscribe';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { RoomKeyGenerator } from './room.key.generator';
import { LockingGuardInterceptor } from 'src/utils/locking.guard.interceptor';
@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class TransactionsGateway {
  private readonly logger = new OriginLogger(TransactionsGateway.name);
  static readonly keyPrefix = 'tx-';

  @WebSocketServer()
  server!: Server;

  constructor(private readonly transactionService: TransactionService) { }

  @UseInterceptors(LockingGuardInterceptor)
  @SubscribeMessage('subscribeTransactions')
  async handleSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: TransactionSubscribePayload) {
    // If one of these methods throw an exception then the subscription will not be successful
    TransactionQueryOptions.applyDefaultOptions(payload.size || 25, {
      withScResults: payload.withScResults,
      withOperations: payload.withOperations,
      withLogs: payload.withLogs,
      withScamInfo: payload.withScamInfo,
      withUsername: payload.withUsername,
      withBlockInfo: payload.withBlockInfo,
      withActionTransferValue: payload.withActionTransferValue,
    });

    const transactionFilter = new TransactionFilter({
      order: payload.order,
      isRelayed: payload.isRelayed,
      isScCall: payload.isScCall,
      withRelayedScresults: payload.withRelayedScresults,
    });

    TransactionFilter.validate(transactionFilter, payload.size || 25);

    const filterIdentifier = JSON.stringify(payload);
    const roomName = `${TransactionsGateway.keyPrefix}${filterIdentifier}`;

    console.log(`[Subscription-bughunt]. new client subscribed to room ${roomName}`);

    if (!client.rooms.has(roomName)) {
      await client.join(roomName);
    }

    return { status: 'success' };
  }

  @SubscribeMessage('unsubscribeTransactions')
  async handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: TransactionSubscribePayload
  ) {
    const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
    const roomName = `${TransactionsGateway.keyPrefix}${filterIdentifier}`;

    console.log(`[Subscription-bughunt]. new client unsubscribed from room ${roomName}`);

    if (client.rooms.has(roomName)) {
      await client.leave(roomName);
    }

    return { status: 'unsubscribed' };
  }

  async pushTransactionsForRoom(roomName: string): Promise<void> {
    console.log(`[Subscription-bughunt]. push transaction for room ${roomName}. prefix: ${TransactionsGateway.keyPrefix}`);
    if (!roomName.startsWith(TransactionsGateway.keyPrefix)) return;

    try {
      const filterIdentifier = roomName.replace(TransactionsGateway.keyPrefix, "");
      const filter = JSON.parse(filterIdentifier);

      const options = TransactionQueryOptions.applyDefaultOptions(
        filter.size || 25,
        {
          withScResults: filter.withScResults,
          withOperations: filter.withOperations,
          withLogs: filter.withLogs,
          withScamInfo: filter.withScamInfo,
          withUsername: filter.withUsername,
          withBlockInfo: filter.withBlockInfo,
          withActionTransferValue: filter.withActionTransferValue,
        },
      );

      const transactionFilter = new TransactionFilter({
        sender: filter.sender,
        receivers: filter.receiver,
        token: filter.token,
        functions: filter.functions,
        senderShard: filter.senderShard,
        receiverShard: filter.receiverShard,
        miniBlockHash: filter.miniBlockHash,
        hashes: filter.hashes,
        status: filter.status,
        before: filter.before,
        after: filter.after,
        condition: filter.condition,
        order: filter.order,
        relayer: filter.relayer,
        isRelayed: filter.isRelayed,
        isScCall: filter.isScCall,
        round: filter.round,
        withRelayedScresults: filter.withRelayedScresults,
      });

      TransactionFilter.validate(transactionFilter, filter.size || 25);

      const [transactions, transactionsCount] = await Promise.all([
        this.transactionService.getTransactions(
          transactionFilter,
          new QueryPagination({ from: filter.from || 0, size: filter.size || 25 }),
          options,
          undefined,
          filter.fields || [],
        ),
        this.transactionService.getTransactionCount(transactionFilter),
      ]);

      console.log(`[Subscription-bughunt]. push transactions for room ${roomName}. filter: ${JSON.stringify(transactionFilter)}. txs length: ${transactions.length}`);
      this.server.to(roomName).emit("transactionUpdate", { transactions, transactionsCount });
    } catch (error) {
      this.logger.error(error);
    }
  }

  async pushTransactions(): Promise<void> {
    const promises: Promise<void>[] = [];

    console.log(`[Subscription-bughunt]. all rooms: ${JSON.stringify(this.server.sockets.adapter.rooms)}`);
    for (const [roomName] of this.server.sockets.adapter.rooms) {
      promises.push(this.pushTransactionsForRoom(roomName));
    }

    await Promise.all(promises);
  }
}
