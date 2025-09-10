import { UseFilters } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { WebsocketExceptionsFilter } from "src/utils/ws-exceptions.filter";

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class ConnectionHandler implements OnGatewayDisconnect, OnGatewayConnection, OnGatewayInit {

    @WebSocketServer()
    server!: Server;

    afterInit(__server: Server) { }

    handleDisconnect(_client: Socket) { }

    handleConnection(client: Socket, ..._args: any[]) {
        client.setMaxListeners(12);
    }
}