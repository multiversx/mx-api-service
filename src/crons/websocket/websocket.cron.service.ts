import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TransactionsGateway } from '../../endpoints/transactions/transaction.gateway';
import { BlocksGateway } from 'src/endpoints/blocks/blocks.gateway';
import { NetworkGateway } from 'src/endpoints/network/network.gateway';

@Injectable()
export class WebsocketCronService {
    constructor(
        private readonly transactionsGateway: TransactionsGateway,
        private readonly blocksGateway: BlocksGateway,
        private readonly networkGateway: NetworkGateway,
    ) { }

    @Cron('*/6 * * * * *')
    async handleTransactionsUpdate() {
        await this.transactionsGateway.pushTransactions();
    }

    @Cron('*/6 * * * * *')
    async handleBlocksUpdate() {
        await this.blocksGateway.pushBlocks();
    }

    @Cron('*/6 * * * * *')
    async handleStatsUpdate() {
        await this.networkGateway.pushStats();
    }
}
