import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BlockService } from './block.service';
import { BlockFilter } from './entities/block.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';

@WebSocketGateway({ cors: { origin: '*' } })
export class BlocksGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    constructor(private readonly blockService: BlockService) { }

    @SubscribeMessage('subscribeBlocks')
    async handleSubscription(client: Socket, payload: any) {
        const filterHash = JSON.stringify(payload);
        await client.join(`block-${filterHash}`);
    }

    async pushBlocks() {
        for (const [roomName] of this.server.sockets.adapter.rooms) {
            if (!roomName.startsWith("block-")) continue;

            const filterHash = roomName.replace("block-", "");
            const filter = JSON.parse(filterHash);

            const blockFilter = new BlockFilter({
                shard: filter.shard,
                proposer: filter.proposer,
                validator: filter.validator,
                epoch: filter.epoch,
                nonce: filter.nonce,
                hashes: filter.hashes,
                order: filter.order,
            });

            const blocks = await this.blockService.getBlocks(
                blockFilter,
                new QueryPagination({ from: filter.from || 0, size: filter.size || 25 }),
                filter.withProposerIdentity,
            );

            this.server.to(roomName).emit('blocksUpdate', blocks);
        }
    }

    handleDisconnect(_client: Socket) { }
}
