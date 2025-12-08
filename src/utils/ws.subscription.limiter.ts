
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsSubscriptionLimiterGuard implements CanActivate {
  static MAX_ROOMS_PER_CLIENT = 5 + 1; // TODO: adjust limit (5 subscriptions + 1 default room client id)
  static MAX_ROOMS_GLOBAL = 10_000; // TODO: adjust

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const totalRoomsGlobal = client.nsp.server.sockets.adapter.rooms.size;
    const totalClientRooms = client.rooms.size;
    if (totalRoomsGlobal >= WsSubscriptionLimiterGuard.MAX_ROOMS_GLOBAL) {
      throw new WsException(`Maximum number of ${WsSubscriptionLimiterGuard.MAX_ROOMS_GLOBAL} global subscriptions accepted by server reached!`);
    }

    if (totalClientRooms >= WsSubscriptionLimiterGuard.MAX_ROOMS_PER_CLIENT) {
      throw new WsException(`Maximum number of ${WsSubscriptionLimiterGuard.MAX_ROOMS_PER_CLIENT} subscriptions per client reached!`);
    }

    return true;
  }
}
