import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseFilters, UseGuards } from '@nestjs/common';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { EventsService } from '../../endpoints/events/events.service';
import { EventsFilter } from '../../endpoints/events/entities/events.filter';
import { EventsSubscribePayload } from '../../endpoints/events/entities/events.subscribe';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { WsSubscriptionLimiterGuard } from 'src/utils/ws.subscription.limiter';
import { RoomKeyGenerator } from './room.key.generator';
import { Lock } from '@multiversx/sdk-nestjs-common';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class EventsGateway {
    private readonly logger = new OriginLogger(EventsGateway.name);
    static readonly keyPrefix = 'events-';

    @WebSocketServer()
    server!: Server;

    constructor(private readonly eventsService: EventsService) { }

    @Lock({ name: 'Subscribe Events Lock', verbose: true })
    @UseGuards(WsSubscriptionLimiterGuard)
    @SubscribeMessage('subscribeEvents')
    async handleSubscription(
        @ConnectedSocket() client: Socket,
        @MessageBody(new WsValidationPipe()) payload: EventsSubscribePayload,
    ) {
        const filterIdentifier = JSON.stringify(payload);
        const roomName = `${EventsGateway.keyPrefix}${filterIdentifier}`;
        if (!client.rooms.has(roomName)) {
            await client.join(roomName);
        }

        return { status: 'success' };
    }

    @SubscribeMessage('unsubscribeEvents')
    async handleUnsubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody(new WsValidationPipe()) payload: EventsSubscribePayload
    ) {
        const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
        const roomName = `${EventsGateway.keyPrefix}${filterIdentifier}`;

        if (client.rooms.has(roomName)) {
            await client.leave(roomName);
        }

        return { status: 'unsubscribed' };
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
