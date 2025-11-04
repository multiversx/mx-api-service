import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NetworkService } from '../../endpoints/network/network.service';
import { UseFilters } from '@nestjs/common';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class NetworkGateway {
  private readonly logger = new OriginLogger(NetworkGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly networkService: NetworkService) { }

  @SubscribeMessage('subscribeStats')
  async handleSubscription(client: Socket) {
    await client.join('statsRoom');
  }

  async pushStats() {
    if (this.server.sockets.adapter.rooms.has('statsRoom')) {
      try {
        const stats = await this.networkService.getStats();
        this.server.to('statsRoom').emit('statsUpdate', stats);
      } catch (error) {
        this.logger.error(error);
      }
    }
  }
}
