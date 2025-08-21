import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NetworkService } from './network.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class NetworkGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private clients = new Set<string>();

    constructor(private readonly networkService: NetworkService) { }

    @SubscribeMessage('subscribeStats')
    async handleSubscription(client: Socket) {
        this.clients.add(client.id);
    }

    async pushStats() {
        const stats = await this.networkService.getStats();

        for (const clientId of this.clients) {
            const client = this.server.sockets.sockets.get(clientId);
            if (client) {
                client.emit('statsUpdate', stats);
            }
        }
    }

    handleDisconnect(client: Socket) {
        this.clients.delete(client.id);
    }
}
