
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsSubscriptionLimiterGuard implements CanActivate {
  static MAX_ROOMS = 5 + 1; // TODO: adjust limit (5 subscriptions + 1 default room client id)

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();

    //TODO: check for ip, not for each socket
    if (client.rooms.size >= WsSubscriptionLimiterGuard.MAX_ROOMS) {
      throw new WsException(`Maximum number of ${WsSubscriptionLimiterGuard.MAX_ROOMS} subscriptions reached!`);
    }

    return true;
  }
}
