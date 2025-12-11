
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

@Injectable()
export class WsSubscriptionLimiterGuard implements CanActivate {
  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) { }

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const totalRoomsGlobal = client.nsp.server.sockets.adapter.rooms.size;
    const totalClientRooms = client.rooms.size;

    console.log(`[Subscription-bughunt] canActivate. Client ${client.id} totalRoomsGlobal: ${totalRoomsGlobal} / ${this.apiConfigService.getWebsocketMaxSubscriptionsPerInstance()}. totalClientRooms: ${totalClientRooms} / ${this.apiConfigService.getWebsocketMaxSubscriptionsPerClient()}`);
    if (totalRoomsGlobal >= this.apiConfigService.getWebsocketMaxSubscriptionsPerInstance()) {
      throw new WsException(`Maximum number of ${this.apiConfigService.getWebsocketMaxSubscriptionsPerInstance()} global subscriptions accepted by server reached!`);
    }

    if (totalClientRooms >= this.apiConfigService.getWebsocketMaxSubscriptionsPerClient() + 1) { // 1 default room with client id
      throw new WsException(`Maximum number of ${this.apiConfigService.getWebsocketMaxSubscriptionsPerClient()} subscriptions per client reached!`);
    }

    return true;
  }
}
