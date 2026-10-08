import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { RoomKeyGenerator } from './room.key.generator';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import { TransactionDetailed } from 'src/endpoints/transactions/entities/transaction.detailed';
import { LockingGuardInterceptor } from 'src/utils/locking.guard.interceptor';
import { TransferCustomSubscribePayload } from 'src/endpoints/websocket/entities/transfers.custom.payload';
import { RawTransfer } from './custom-subscriptions/raw.transfer';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class TransfersCustomGateway {
  static keyPrefix = 'custom-transfer-';
  @WebSocketServer()
  server!: Server;

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

  matchRooms(rawTransfers: RawTransfer[]): Map<string, TransactionDetailed[]> {
    const transfersFilteredForBroadcast: Map<string, TransactionDetailed[]> = new Map();

    for (const { transfer, tokens } of rawTransfers) {
      const roomKeys = RoomKeyGenerator.generate(
        TransfersCustomGateway.keyPrefix,
        { ...transfer, tokens },
        TransferCustomSubscribePayload,
      );

      for (const roomKey of roomKeys) {
        const substitutions = TransferCustomSubscribePayload.getFieldsSubstitutions();
        for (const [key, substituteFields] of Object.entries(substitutions)) {
          for (const substituteField of substituteFields) {
            const substituteRoomKey = RoomKeyGenerator.substitute(TransfersCustomGateway.keyPrefix, roomKey, substituteField, key);
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

    return transfersFilteredForBroadcast;
  }

  broadcast(timestampMs: number, transfersFilteredForBroadcast: Map<string, Transaction[]>): void {
    for (const [roomName, transfers] of transfersFilteredForBroadcast) {
      this.server.to(roomName).emit("customTransferUpdate", { transfers: transfers.distinct(), timestampMs });
    }
  }
}
