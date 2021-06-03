import { Injectable } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from 'socket.io'

@Injectable()
@WebSocketGateway(3002)
export class EventsGateway {
  @WebSocketServer()
  server: Server | undefined

  onAccountBalanceChanged(account: string) {
    // logger.log(`publishing websocket event balanceChanged:${account}`);

    this.server?.emit(`balanceChanged:${account}`); 
  }
}