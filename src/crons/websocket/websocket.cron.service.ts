import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TransactionsGateway } from '../../endpoints/transactions/transaction.gateway';
import { BlocksGateway } from 'src/endpoints/blocks/blocks.gateway';

@Injectable()
export class WebsocketCronService {
    constructor(
        private readonly transactionsGateway: TransactionsGateway,
        private readonly blocksGateway: BlocksGateway,
    ) { }

    @Cron('*/6 * * * * *')
    async handleTransactionsUpdate() {
        console.log('executer websocket push transactions')
        await this.transactionsGateway.pushTransactions();
    }

    @Cron('*/6 * * * * *')
    async handleBlocksUpdate() {
        console.log('executed websocket push blocks')
        await this.blocksGateway.pushBlocks();
    }
}
