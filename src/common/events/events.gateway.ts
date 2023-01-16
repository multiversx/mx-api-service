import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  BaseWsExceptionFilter,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseFilters } from '@nestjs/common';
import { OriginLogger } from '@elrondnetwork/erdnest';

@Injectable()
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

  constructor() { }

  /**
   *
   * @param socket Socket
   */
  // eslint-disable-next-line require-await
  async handleConnection(socket: Socket) {
    this.logger.log(`Client ${socket.id} connected.`);
  }

  /**
   *
   * @param socket Socket
   */
  // eslint-disable-next-line require-await
  async handleDisconnect(socket: any) {
    // A client has disconnected
    this.logger.warn(`Client ${socket.client.id} disconnected.`);
  }

  // eslint-disable-next-line require-await
  async sendNotification(data: any) {
    this.logger.warn(`got following data: ${data}`);
  }
}
