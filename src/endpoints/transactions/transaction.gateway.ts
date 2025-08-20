import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TransactionService } from './transaction.service';
import { TransactionFilter } from './entities/transaction.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { TransactionQueryOptions } from './entities/transactions.query.options';

@WebSocketGateway({ cors: { origin: '*' } })
export class TransactionsGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    // Map: filterHash -> set of clientIds
    private filterClients = new Map<string, Set<string>>();
    // Map: clientId -> filterHash
    private clientFilterHash = new Map<string, string>();

    constructor(private readonly transactionService: TransactionService) { }

    @SubscribeMessage('subscribeTransactions')
    async handleSubscription(client: Socket, payload: any) {
        const filterHash = JSON.stringify(payload);

        if (!this.filterClients.has(filterHash)) {
            this.filterClients.set(filterHash, new Set());
        }
        this.filterClients.get(filterHash)!.add(client.id);
        this.clientFilterHash.set(client.id, filterHash);
    }

    async pushTransactions() {
        for (const [filterHash, clientIds] of this.filterClients.entries()) {
            const filter = JSON.parse(filterHash);

            const options = TransactionQueryOptions.applyDefaultOptions(filter.size || 25, {
                withScResults: filter.withScResults,
                withOperations: filter.withOperations,
                withLogs: filter.withLogs,
                withScamInfo: filter.withScamInfo,
                withUsername: filter.withUsername,
                withBlockInfo: filter.withBlockInfo,
                withActionTransferValue: filter.withActionTransferValue,
            });

            const transactionFilter = new TransactionFilter({
                sender: filter.sender,
                receivers: filter.receiver,
                token: filter.token,
                functions: filter.functions,
                senderShard: filter.senderShard,
                receiverShard: filter.receiverShard,
                miniBlockHash: filter.miniBlockHash,
                hashes: filter.hashes,
                status: filter.status,
                before: filter.before,
                after: filter.after,
                condition: filter.condition,
                order: filter.order,
                relayer: filter.relayer,
                isRelayed: filter.isRelayed,
                isScCall: filter.isScCall,
                round: filter.round,
                withRelayedScresults: filter.withRelayedScresults,
            });

            TransactionFilter.validate(transactionFilter, filter.size || 25);

            const txs = await this.transactionService.getTransactions(
                transactionFilter,
                new QueryPagination({ from: filter.from || 0, size: filter.size || 25 }),
                options,
                undefined,
                filter.fields || [],
            );

            for (const clientId of clientIds) {
                const client = this.server.sockets.sockets.get(clientId);
                if (client) {
                    client.emit('transactionUpdate', txs);
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
