import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { PoolService } from '../../endpoints/pool/pool.service';
import { PoolFilter } from '../../endpoints/pool/entities/pool.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { PoolSubscribePayload } from '../../endpoints/pool/entities/pool.subscribe';
import { RoomKeyGenerator } from './room.key.generator';
import { LockingGuardInterceptor } from 'src/utils/locking.guard.interceptor';
import { TransactionPoolTooLargeError } from '../../endpoints/pool/entities/transaction.pool.too.large.error';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class PoolGateway {
    private readonly logger = new OriginLogger(PoolGateway.name);
    static readonly keyPrefix = 'pool-';

    @WebSocketServer()
    server!: Server;

    constructor(private readonly poolService: PoolService) { }

    @UseInterceptors(LockingGuardInterceptor)
    @SubscribeMessage('subscribePool')
    async handleSubscription(
        @ConnectedSocket() client: Socket,
        @MessageBody(new WsValidationPipe()) payload: PoolSubscribePayload,
    ) {
        const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
        const roomName = `${PoolGateway.keyPrefix}${filterIdentifier}`;

        if (!client.rooms.has(roomName)) {
            await client.join(roomName);
        }
        return { status: 'success' };
    }

    @SubscribeMessage('unsubscribePool')
    async handleUnsubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody(new WsValidationPipe()) payload: PoolSubscribePayload
    ) {
        const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
        const roomName = `${PoolGateway.keyPrefix}${filterIdentifier}`;

        if (client.rooms.has(roomName)) {
            await client.leave(roomName);
        }

        return { status: 'unsubscribed' };
    }

    async pushPoolForRoom(roomName: string): Promise<void> {
        if (!roomName.startsWith("pool-")) return;

        try {
            const filterIdentifier = roomName.replace("pool-", "");
            const filter: PoolSubscribePayload = JSON.parse(filterIdentifier);

            const poolFilter = new PoolFilter({
                type: filter.type,
            });

            const [pool, poolCount] = await Promise.all([
                this.poolService.getPool(
                    new QueryPagination({
                        from: filter.from,
                        size: filter.size,
                    }),
                    poolFilter,
                ).catch(error => this.nullIfTooLarge(error)),
                this.poolService.getPoolCount(poolFilter).catch(error => this.nullIfTooLarge(error)),
            ]);

            if (pool === null) {
                // the total count comes from the gateway, so it is still sent unless the room filters by type
                this.server.to(roomName).emit("poolUpdate", { pool: [], poolCount, tooLarge: true });
                return;
            }

            this.server.to(roomName).emit("poolUpdate", { pool, poolCount });
        } catch (error) {
            this.logger.error(error);
        }
    }

    // a pool too large to be read is sent to the clients as such, instead of being logged as an error
    private nullIfTooLarge(error: any): null {
        if (error instanceof TransactionPoolTooLargeError) {
            return null;
        }

        throw error;
    }

    async pushPool(): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const [roomName] of this.server.sockets.adapter.rooms) {
            promises.push(this.pushPoolForRoom(roomName));
        }

        await Promise.all(promises);
    }

}
