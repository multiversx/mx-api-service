import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NetworkService } from './network.service';

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
        const stats = await this.networkService.getStats();
        this.server.to('statsRoom').emit('statsUpdate', stats);
    }

    handleDisconnect(client: Socket) {
        console.log(`client ${client.id} disconnected`);
    }
}
