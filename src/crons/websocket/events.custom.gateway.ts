import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseFilters, UseGuards } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';

import { QueryPagination } from 'src/common/entities/query.pagination';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { WsSubscriptionLimiterGuard } from 'src/utils/ws.subscription.limiter';
import { RoomKeyGenerator } from './room.key.generator';
import { EventsService } from 'src/endpoints/events/events.service';
import { EventsCustomSubscribePayload } from 'src/endpoints/events/entities/events.custom.subscribe';
import { EventsFilter } from 'src/endpoints/events/entities/events.filter';
import { Events } from 'src/endpoints/events/entities/events';
import { Lock } from '@multiversx/sdk-nestjs-common';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class EventsCustomGateway {
  private readonly logger = new OriginLogger(EventsCustomGateway.name);

  static keyPrefix = 'custom-events-';

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly eventsService: EventsService,
  ) { }

  @Lock({ name: 'Subscription lock', verbose: true })
  @UseGuards(WsSubscriptionLimiterGuard)
  @SubscribeMessage('subscribeCustomEvents')
  async handleCustomSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: EventsCustomSubscribePayload
  ) {
    const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
    const roomName = `${EventsCustomGateway.keyPrefix}${filterIdentifier}`;

    if (!client.rooms.has(roomName)) {
      await client.join(roomName);
    }

    return { status: 'success' };
  }

  @SubscribeMessage('unsubscribeCustomEvents')
  async handleCustomUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: EventsCustomSubscribePayload
  ) {
    const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
    const roomName = `${EventsCustomGateway.keyPrefix}${filterIdentifier}`;

    if (client.rooms.has(roomName)) {
      await client.leave(roomName);
    }

    return { status: 'unsubscribed' };
  }

  async pushEventsForTimestampMs(timestampMs: number): Promise<void> {
    try {
      const allEvents = await this.eventsService.getEvents(
        new QueryPagination({ size: 10000 }),
        new EventsFilter({ before: timestampMs, after: timestampMs }),
      );

      const eventsFilteredForBroadcast: Map<string, Events[]> = new Map();

      for (const event of allEvents) {
        const roomKeys = RoomKeyGenerator.generate(
          EventsCustomGateway.keyPrefix,
          event,
          EventsCustomSubscribePayload,
        );

        for (const roomKey of roomKeys) {
          if (this.server.sockets.adapter.rooms.has(roomKey)) {
            if (!eventsFilteredForBroadcast.has(roomKey)) {
              eventsFilteredForBroadcast.set(roomKey, []);
            }
            eventsFilteredForBroadcast.get(roomKey)!.push(event);
          }
        }
      }

      for (const [roomName] of eventsFilteredForBroadcast) {
        this.server.to(roomName).emit("customEventUpdate", {
          events: eventsFilteredForBroadcast.get(roomName),
          timestampMs,
        });
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
