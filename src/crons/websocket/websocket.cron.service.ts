import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TransactionsGateway } from '../../endpoints/transactions/transaction.gateway';
import { BlocksGateway } from 'src/endpoints/blocks/blocks.gateway';
import { NetworkGateway } from 'src/endpoints/network/network.gateway';
import { Lock } from "@multiversx/sdk-nestjs-common";
@Injectable()
export class WebsocketCronService {
    constructor(
        private readonly transactionsGateway: TransactionsGateway,
        private readonly blocksGateway: BlocksGateway,
        private readonly networkGateway: NetworkGateway,
    ) { }

    @Cron('*/6 * * * * *')
    @Lock({ name: 'Push transactions to subscribers', verbose: true })
    async handleTransactionsUpdate() {
        await this.transactionsGateway.pushTransactions();
    }

    @Cron('*/6 * * * * *')
    @Lock({ name: 'Push blocks to subscribers', verbose: true })
    async handleBlocksUpdate() {
        await this.blocksGateway.pushBlocks();
    }

    @Cron('*/6 * * * * *')
    @Lock({ name: 'Push stats to subscribers', verbose: true })
    async handleStatsUpdate() {
        await this.networkGateway.pushStats();
    }
}
