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
        const filterIdentifier = JSON.stringify(payload);
        await client.join(`events-${filterIdentifier}`);

        return { status: 'success' };
    }

    async pushEventsForRoom(roomName: string): Promise<void> {
        if (!roomName.startsWith("events-")) return;

        try {
            const filterIdentifier = roomName.replace("events-", "");
            const filter: EventsSubscribePayload = JSON.parse(filterIdentifier);

            const eventsFilter = new EventsFilter({
                shard: filter.shard,
            });

            const [events, eventsCount] = await Promise.all([
                this.eventsService.getEvents(
                    new QueryPagination({
                        from: filter.from || 0,
                        size: filter.size || 25,
                    }),
                    eventsFilter,
                ),
                this.eventsService.getEventsCount(eventsFilter),
            ]);

            this.server.to(roomName).emit("eventsUpdate", { events, eventsCount });
        } catch (error) {
            this.logger.error(error);
        }
    }

    async pushEvents(): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const [roomName] of this.server.sockets.adapter.rooms) {
            promises.push(this.pushEventsForRoom(roomName));
        }

        await Promise.all(promises);
    }
}
