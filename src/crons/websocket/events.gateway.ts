import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseFilters } from '@nestjs/common';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { EventsService } from '../../endpoints/events/events.service';
import { EventsFilter } from '../../endpoints/events/entities/events.filter';
import { EventsSubscribePayload } from '../../endpoints/events/entities/events.subscribe';
import { QueryPagination } from 'src/common/entities/query.pagination';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class EventsGateway {
    private readonly logger = new OriginLogger(EventsGateway.name);

    @WebSocketServer()
    server!: Server;

    constructor(private readonly eventsService: EventsService) { }

    @SubscribeMessage('subscribeEvents')
    async handleSubscription(
        @ConnectedSocket() client: Socket,
        @MessageBody(new WsValidationPipe()) payload: EventsSubscribePayload,
    ) {
        const filterHash = JSON.stringify(payload);
        await client.join(`events-${filterHash}`);

        return { status: 'success' };
    }

    async pushEvents() {
        for (const [roomName] of this.server.sockets.adapter.rooms) {
            try {
                if (!roomName.startsWith("events-")) continue;

                const filterHash = roomName.replace("events-", "");
                const filter: EventsSubscribePayload = JSON.parse(filterHash);

                const eventsFilter = new EventsFilter({
                    shard: filter.shard,
                });

                const events = await this.eventsService.getEvents(
                    new QueryPagination({ from: filter.from || 0, size: filter.size || 25 }),
                    eventsFilter,
                );

                this.server.to(roomName).emit('eventsUpdate', events);
            } catch (error) {
                this.logger.error(error);
            }
        }
    }
}
