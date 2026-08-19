import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TransactionFilter } from '../../endpoints/transactions/entities/transaction.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { RoomKeyGenerator } from './room.key.generator';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import { LockingGuardInterceptor } from 'src/utils/locking.guard.interceptor';
import { TransferService } from 'src/endpoints/transfers/transfer.service';
import { TransferCustomSubscribePayload } from 'src/endpoints/websocket/entities/transfers.custom.payload';
import { TransactionQueryOptions } from 'src/endpoints/transactions/entities/transactions.query.options';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class TransfersCustomGateway {
  private readonly logger = new OriginLogger(TransfersCustomGateway.name);
  static keyPrefix = 'custom-transfer-';
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly transferService: TransferService,
  ) { }

  @UseInterceptors(LockingGuardInterceptor)
  @SubscribeMessage('subscribeCustomTransfers')
  async handleCustomSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: TransferCustomSubscribePayload) {

    const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
    if (!client.rooms.has(`${TransfersCustomGateway.keyPrefix}${filterIdentifier}`)) {
      await client.join(`${TransfersCustomGateway.keyPrefix}${filterIdentifier}`);
    }
    return { status: 'success' };
  }

  @SubscribeMessage('unsubscribeCustomTransfers')
  async handleCustomUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: TransferCustomSubscribePayload
  ) {
    const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
    const roomName = `${TransfersCustomGateway.keyPrefix}${filterIdentifier}`;

    if (client.rooms.has(roomName)) {
      await client.leave(roomName);
    }

    return { status: 'unsubscribed' };
  }

  async pushTransfersForTimestampMs(timestampMs: number): Promise<void> {
    try {
      const allTransfers: Transaction[] = [];
      const size = 10000;
      const filter = new TransactionFilter({ before: timestampMs, after: timestampMs, withTxsRelayedByAddress: true });
      const options = new TransactionQueryOptions({ withScamInfo: false, withUsername: true, withBlockInfo: false, withLogs: false, withOperations: false, withActionTransferValue: false, withTxsOrder: false });

      let batch = await this.transferService.getTransfers(filter, new QueryPagination({ size }), options);
      allTransfers.push(...batch);

      while (batch.length === size) {
        const searchAfter = batch[batch.length - 1].searchAfter;
        if (searchAfter == null) {
          break;
        }

        batch = await this.transferService.getTransfers(filter, new QueryPagination({ size, searchAfter }), options);

        allTransfers.push(...batch);
      }

      const transfersFilteredForBroadcast: Map<string, Transaction[]> = new Map();

      for (const transfer of allTransfers) {
        const roomKeys = RoomKeyGenerator.generate(
          TransfersCustomGateway.keyPrefix,
          transfer,
          TransferCustomSubscribePayload,
        );

        for (const roomKey of roomKeys) {
          const substitutions = TransferCustomSubscribePayload.getFieldsSubstitutions();
          for (const [key, substituteFields] of Object.entries(substitutions)) {
            for (const substituteField of substituteFields) {
              const substituteRoomKey = roomKey.replace(`"${substituteField}":`, `"${key}":`);
              if (this.server.sockets.adapter.rooms.has(substituteRoomKey)) {
                if (!transfersFilteredForBroadcast.has(substituteRoomKey)) {
                  transfersFilteredForBroadcast.set(substituteRoomKey, []);
                }
                transfersFilteredForBroadcast.get(substituteRoomKey)!.push(transfer);
              }
            }
          }

          if (this.server.sockets.adapter.rooms.has(roomKey)) {
            if (!transfersFilteredForBroadcast.has(roomKey)) {
              transfersFilteredForBroadcast.set(roomKey, []);
            }
            transfersFilteredForBroadcast.get(roomKey)!.push(transfer);
          }
        }
      }

      for (const [roomName] of transfersFilteredForBroadcast) {
        this.server.to(roomName).emit("customTransferUpdate", { transfers: transfersFilteredForBroadcast.get(roomName)?.distinct(), timestampMs });
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

}
