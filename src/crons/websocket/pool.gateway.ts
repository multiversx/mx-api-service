import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
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
export class PoolGateway implements OnGatewayDisconnect {
    private readonly logger = new OriginLogger(PoolGateway.name);

    @WebSocketServer()
    server!: Server;

    constructor(private readonly poolService: PoolService) { }

    @SubscribeMessage('subscribePool')
    async handleSubscription(
        @ConnectedSocket() client: Socket,
        @MessageBody(new WsValidationPipe()) payload: PoolSubscribePayload,
    ) {
        const filterHash = JSON.stringify(payload);
        await client.join(`pool-${filterHash}`);

        return { status: 'success' };
    }

    async pushPool() {
        for (const [roomName] of this.server.sockets.adapter.rooms) {
            try {
                if (!roomName.startsWith("pool-")) continue;

                const filterHash = roomName.replace("pool-", "");
                const filter: PoolSubscribePayload = JSON.parse(filterHash);

                const pool = await this.poolService.getPool(new QueryPagination({ from: filter.from, size: filter.size }), new PoolFilter({
                    type: filter.type,
                }));

                this.server.to(roomName).emit('poolUpdate', pool);
            } catch (error) {
                this.logger.error(error);
            }
        }
    }

    handleDisconnect(_client: Socket) { }
}
