import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  BaseWsExceptionFilter,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs';
import { AuthGuardWs } from '../auth/auth.guard.ws';
import { UserDb } from '../persistence/entities/user.db';
import { SubscriptionEntry } from './entities/subscription.entry';
import { Notification } from './events.types';
import { EventsSubscriptionValidationPipe } from './events.subscription.validation.pipe';
import { ApiConfigService } from '../api-config/api.config.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsMetricsService } from '../events-metrics/events-metrics.service';
import { AuthService } from '../auth/auth.service';
import { EventsMetrics } from '../events-metrics/events-metrics.map.type';
import { EventsUtils } from './events.utils';

@UseGuards(AuthGuardWs)
@UseFilters(new BaseWsExceptionFilter())
@WebSocketGateway(3100, {
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server | undefined;
  private readonly logger = new OriginLogger(EventsGateway.name);

  constructor(private readonly apiConfigService: ApiConfigService, private readonly authService: AuthService, private readonly eventsMetricsService: EventsMetricsService) { }

  /**
   * Connection handling
   * 
   * @param socket Socket
   */
  async handleConnection(socket: Socket) {
    // A client has connected
    const user: UserDb | undefined = await this.authService.validateRequest(socket.handshake.auth?.token);

    if (!user) {
      this.logger.error(
        `Client ${socket.client} disconnected due to unaothorized request.`,
      );
      socket.disconnect(true);
      return;
    }

    // Join address room to keep track of connectiosn
    await socket.join(user.address);
    this.server?.in(socket.id).socketsJoin(
      user.address,
    );

    // Join expiryDate room to disconnect all sockets at once
    await socket.join(user.expiryDate.toString());
    this.server?.in(socket.id).socketsJoin(
      user.expiryDate.toString(),
    );

    // Validate if user has already more connections than allowed across all nodes
    const userConnections = await this.server?.in(user.address).fetchSockets();
    const maxConnections = this.apiConfigService.getLiveWebsocketEventsMaxConnections();

    if (userConnections && userConnections?.length >= maxConnections) {
      this.logger.error(
        `Client ${user.address} has already ${maxConnections} connections.`,
      );
      socket.disconnect(true);
      return;
    }

    this.logger.log(`Client ${socket.id} connected.`);
  }

  /**
   * Disconnect handling
   * 
   * @param socket Socket
   */
  // eslint-disable-next-line require-await
  async handleDisconnect(socket: Socket) {
    // A client has disconnected
    this.logger.log(`Client ${socket.id} disconnected.`);
  }

  /**
   *  Parse entries from client and assign socket to
   *  the corresponding rooms
   *
   * @param socket Socket
   * @param subscriptionEntries Array<SubscriptionEntry>
   */
  async parseSubscriptionEntries(
    socket: Socket,
    subscriptionEntries: Array<SubscriptionEntry>,
  ) {
    const MAX_SUBSCRIPTION_ENTRIES = 10;
    const DEFAULT_ROOMS_PER_CONNECTION = 3;
    const MAX_ROOMS_PER_CONNECTION = MAX_SUBSCRIPTION_ENTRIES + DEFAULT_ROOMS_PER_CONNECTION;

    if (subscriptionEntries.length + socket.rooms.size > MAX_ROOMS_PER_CONNECTION) {
      this.logger.error(`Client's subscription entries are more than ${MAX_SUBSCRIPTION_ENTRIES}.`);
      throw new WsException(
        `Can't subscribe to more than ${MAX_SUBSCRIPTION_ENTRIES} entries per connection.`,
      );
    }

    // Set client to receive only particular events
    for (const entry of subscriptionEntries) {
      const address = entry.address;
      const identifier = entry.identifier;

      // Parse each event and populate table as follows
      // Add all clients to the event that has respective TxHash
      if (address && !identifier) {
        await socket.join(EventsUtils.addressToken(address));
      } else if (!address && identifier) {
        await socket.join(EventsUtils.idToken(identifier));
      } else if (address && identifier) {
        await socket.join(EventsUtils.idAddressToken(address, identifier));
      }
    }
  }

  /**
   * Send a notification to clients, based
   * on notification address, identifier and address+identifier
   *
   * @param data Notification
   */
  // eslint-disable-next-line require-await
  async sendNotification(data: Notification) {
    this.logger.log('Sending notification to connected users.');

    if (data.events) {
      for (const event of data.events) {
        const address = event.address;
        const identifier = event.identifier;
        this.server?.to(EventsUtils.addressToken(address))
          .to(EventsUtils.idToken(identifier))
          .to(EventsUtils.idAddressToken(address, identifier))
          .emit('notifications', event);

        // For each event, increment metrics
        this.eventsMetricsService.incrementMetrics(event);
      }
    }
  }

  /**
   *
   * @param client
   * @param subscriptionEntries
   */
  @UsePipes(EventsSubscriptionValidationPipe)
  @SubscribeMessage('subscription_entries')
  async onSubsEntries(
    @ConnectedSocket() client: Socket,
    @MessageBody() subscriptionEntries: Array<SubscriptionEntry>,
  ) {
    this.logger.log(`Received subscription entries from client ${client.id}.`);
    await this.parseSubscriptionEntries(client, subscriptionEntries);
  }

  @Cron(CronExpression.EVERY_HOUR)
  handleCron() {
    // Get timestamp to fixed Hours
    const currentTimestamp =
      Math.floor(new Date().getTime() / 1000 / 60 / 60) * 60 * 60 * 1000;
    this.closeSocketsByexpiryDate(currentTimestamp);
  }

  // eslint-disable-next-line require-await
  @Cron(CronExpression.EVERY_5_SECONDS)
  async createMetricsMap() {
    // Retrieve all rooms from across all servers
    const rooms = this.server?.sockets.adapter.rooms ?? [];
    const metricsMap: EventsMetrics = new Map();

    // Extract rooms that are IDENTIFIERS/ADDRESSES/BOTH
    for (const room of rooms) {
      let roomName = room[0];
      const roomSockets = room[1];

      if (!EventsUtils.checkRoomType(roomName)) {
        continue;
      }

      // Subtract prefix from room name
      roomName = EventsUtils.trimRoomName(roomName);
      metricsMap.set(roomName, []);

      // For each socket from the room, get the address room that it contains
      const walletAddresRegx = new RegExp("^erd1[a-zA-Z0-9]{58}$");
      for (const socket of roomSockets) {
        const socketRooms = this.server?.sockets.sockets.get(socket)?.rooms ?? [];

        for (const room of socketRooms) {
          if (walletAddresRegx.test(room)) {
            metricsMap.get(roomName)?.push(room);
          }
        }
      }

      this.eventsMetricsService.setMetricsMap(metricsMap);
    }
  }
  /**
   * Close all sockets for a given expiryDate
   */
  closeSocketsByexpiryDate(expiryDate: number) {
    this.server?.in(expiryDate.toString()).disconnectSockets();
  }
}

