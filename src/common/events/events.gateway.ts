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
import { OriginLogger } from '@elrondnetwork/erdnest';
import { AuthGuardWs } from '../auth/auth.guard';
import { UserDb } from '../persistence/userdb/entities/user.db';
import { SubscriptionEntry } from './entities/subscription.entry';
import { Notification } from './events.types';
import { ValidationPipe } from './validation.pipe';
import { ApiConfigService } from '../api-config/api.config.service';


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

  constructor(private readonly apiConfigService: ApiConfigService, private authGuardWs: AuthGuardWs) { }

  /**
   *
   * @param socket Socket
   */
  async handleConnection(socket: Socket) {
    const userDetails: UserDb = { address: '', availability: 0 };
    // A client has connected
    const allowConnection: boolean = await this.authGuardWs.validateRequest(socket, userDetails);

    if (!allowConnection) {
      this.logger.error(
        `Client ${socket.client} disconnected due to unaothorized request.`,
      );
      socket.disconnect(true);
      return;
    }

    // Validate if user has already more connections than allowed across all nodes
    const user_connections = await this.server?.sockets.adapter.sockets(
      new Set([userDetails.address]),
    );

    const maxConnections = this.apiConfigService.getLiveWebsocketEventsMaxConnections();
    if (user_connections && user_connections.size >= maxConnections) {
      this.logger.error(
        `Client ${userDetails.address} has already ${maxConnections} connections.`,
      );
      socket.disconnect(true);
      return;
    }

    // Join address room to keep track of connectiosn
    await socket.join(userDetails.address);
    this.server?.in(socket.id).socketsJoin(
      userDetails.address,
    );

    // Join availability room to disconnect all sockets at once
    await socket.join(userDetails.availability.toString());
    this.server?.in(socket.id).socketsJoin(
      socket.id,
    );

    this.logger.log(`Client ${socket.id} connected.`);
  }

  /**
   *
   * @param socket Socket
   */
  // eslint-disable-next-line require-await
  async handleDisconnect(socket: Socket) {
    // A client has disconnected
    this.logger.warn(`Client ${socket.id} disconnected.`);
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
    if (subscriptionEntries.length > Math.abs(socket.rooms.size - 13)) {
      this.logger.error("Client's subscription entries are more than 10.");
      throw new WsException(
        "Can't subscribe to more than 10 entries per connection.",
      );
    }
    // Set client to receive only particular events
    for (const entry of subscriptionEntries) {
      const address = entry.address;
      const identifier = entry.identifier;

      // Parse each event and populate table as follows
      // Add all clients to the event that has respective TxHash
      address && !identifier && await socket.join(address);
      identifier && await socket.join(identifier);
      address && identifier && await socket.join(address + identifier);
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
        this.server?.to(address)
          .to(identifier)
          .to(address + identifier)
          .emit('notifications', event);
      }
    }
  }

  /**
   *
   * @param client
   * @param subscriptionEntries
   */
  @UsePipes(ValidationPipe)
  @SubscribeMessage('subscription_entries')
  async onSubsEntries(
    @ConnectedSocket() client: Socket,
    @MessageBody() subscriptionEntries: Array<SubscriptionEntry>,
  ) {
    this.logger.log(`Received subscription entries from client ${client.id}.`);
    await this.parseSubscriptionEntries(client, subscriptionEntries);
  }

  /**
   * Close all sockets for a given availability
   */
  closeSocketsByAvailability(availability: number) {
    this.server?.in(availability.toString()).disconnectSockets();
  }
}
