import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseFilters } from '@nestjs/common';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';

import { PoolService } from '../../endpoints/pool/pool.service';
import { PoolFilter } from '../../endpoints/pool/entities/pool.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { PoolSubscribePayload } from '../../endpoints/pool/entities/pool.subscribe';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class PoolGateway {
    private readonly logger = new OriginLogger(PoolGateway.name);

    @WebSocketServer()
    server!: Server;

    constructor(private readonly poolService: PoolService) { }

    @SubscribeMessage('subscribePool')
    async handleSubscription(
        @ConnectedSocket() client: Socket,
        @MessageBody(new WsValidationPipe()) payload: PoolSubscribePayload,
    ) {
        const filterIdentifier = JSON.stringify(payload);
        await client.join(`pool-${filterIdentifier}`);

        return { status: 'success' };
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
                ),
                this.poolService.getPoolCount(poolFilter),
            ]);

            this.server.to(roomName).emit("poolUpdate", { pool, poolCount });
        } catch (error) {
            this.logger.error(error);
        }
    }

    async pushPool(): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const [roomName] of this.server.sockets.adapter.rooms) {
            promises.push(this.pushPoolForRoom(roomName));
        }

        await Promise.all(promises);
    }

}
