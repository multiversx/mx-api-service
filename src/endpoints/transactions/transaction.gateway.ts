import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TransactionService } from './transaction.service';
import { TransactionFilter } from './entities/transaction.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { TransactionQueryOptions } from './entities/transactions.query.options';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { TransactionSubscribePayload } from './entities/dtos/transaction.subscribe';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { UseFilters } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' } })
export class TransactionsGateway implements OnGatewayDisconnect {
  private readonly logger = new OriginLogger(TransactionsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly transactionService: TransactionService) { }

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

    const filterHash = JSON.stringify(payload);
    await client.join(`tx-${filterHash}`);

    return { status: 'success' };
  }

  async pushTransactions() {
    for (const [roomName] of this.server.sockets.adapter.rooms) {
      try {
        if (!roomName.startsWith("tx-")) continue;

        const filterHash = roomName.replace("tx-", "");
        const filter = JSON.parse(filterHash);

        const options = TransactionQueryOptions.applyDefaultOptions(filter.size || 25, {
          withScResults: filter.withScResults,
          withOperations: filter.withOperations,
          withLogs: filter.withLogs,
          withScamInfo: filter.withScamInfo,
          withUsername: filter.withUsername,
          withBlockInfo: filter.withBlockInfo,
          withActionTransferValue: filter.withActionTransferValue,
        });

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

        const txs = await this.transactionService.getTransactions(
          transactionFilter,
          new QueryPagination({ from: filter.from || 0, size: filter.size || 25 }),
          options,
          undefined,
          filter.fields || [],
        );

        this.server.to(roomName).emit('transactionUpdate', txs);
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  handleDisconnect(_client: Socket) { }
}
