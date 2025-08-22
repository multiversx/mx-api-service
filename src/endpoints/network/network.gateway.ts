import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NetworkService } from './network.service';
import { UseFilters } from '@nestjs/common';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' } })
export class NetworkGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly networkService: NetworkService) { }

  @SubscribeMessage('subscribeStats')
  async handleSubscription(client: Socket) {
    await client.join('statsRoom');
  }

  async pushStats() {
    if (this.server.sockets.adapter.rooms.has('statsRoom')) {
      const stats = await this.networkService.getStats();
      this.server.to('statsRoom').emit('statsUpdate', stats);
    }
  }

  handleDisconnect(_client: Socket) { }
}
