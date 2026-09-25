import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NetworkService } from '../../endpoints/network/network.service';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { LockingGuardInterceptor } from 'src/utils/locking.guard.interceptor';
import { LatestBlocksTracker } from './latest.blocks.tracker';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class NetworkGateway {
  private readonly logger = new OriginLogger(NetworkGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly networkService: NetworkService,
    private readonly latestBlocksTracker: LatestBlocksTracker,
  ) { }

  @UseInterceptors(LockingGuardInterceptor)
  @SubscribeMessage('subscribeStats')
  async handleSubscription(client: Socket) {
    if (!client.rooms.has('statsRoom')) {
      await client.join('statsRoom');
    }

    return { status: 'success' };
  }

  @SubscribeMessage('unsubscribeStats')
  async handleUnsubscribe(client: Socket) {
    if (client.rooms.has('statsRoom')) {
      await client.leave('statsRoom');
    }

    return { status: 'unsubscribed' };
  }

  async pushStats() {
    const roomNames = await this.latestBlocksTracker.getRoomsWithNewBlocks('statsRoom', this.server.sockets.adapter.rooms);
    if (roomNames.length === 0) {
      return;
    }

    try {
      const stats = await this.networkService.getStats(true);
      this.server.to('statsRoom').emit('statsUpdate', stats);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
