import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BlockService } from './block.service';
import { BlockFilter } from './entities/block.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';

@WebSocketGateway({ cors: { origin: '*' } })
export class BlocksGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    // Map: filterHash -> set of clientIds
    private filterClients = new Map<string, Set<string>>();
    // Map: clientId -> filterHash
    private clientFilterHash = new Map<string, string>();

    constructor(private readonly blockService: BlockService) { }

    @SubscribeMessage('subscribeBlocks')
    async handleSubscription(client: Socket, payload: any) {
        const filterHash = JSON.stringify(payload);

        if (!this.filterClients.has(filterHash)) {
            this.filterClients.set(filterHash, new Set());
        }
        this.filterClients.get(filterHash)!.add(client.id);
        this.clientFilterHash.set(client.id, filterHash);
    }

    async pushBlocks() {
        for (const [filterHash, clientIds] of this.filterClients.entries()) {
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

            const txs = await this.blockService.getBlocks(
                blockFilter,
                new QueryPagination({ from: filter.from || 0, size: filter.size || 25 }),
                filter.withProposerIdentity,
            );

            for (const clientId of clientIds) {
                const client = this.server.sockets.sockets.get(clientId);
                if (client) {
                    client.emit('blocksUpdate', txs);
                }
            }
        }
    }

    handleDisconnect(client: Socket) {
        const filterHash = this.clientFilterHash.get(client.id);
        if (filterHash) {
            const set = this.filterClients.get(filterHash);
            if (set) {
                set.delete(client.id);
                if (set.size === 0) {
                    this.filterClients.delete(filterHash);
                }
            }
            this.clientFilterHash.delete(client.id);
        }
    }
}
