import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { NodeModule } from 'src/endpoints/nodes/node.module';
import { ShardModule } from 'src/endpoints/shards/shard.module';
import { TransactionModule } from 'src/endpoints/transactions/transaction.module';
import { NftWorkerModule } from 'src/queue.worker/nft.worker/nft.worker.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { TransactionProcessorService } from './transaction.processor.service';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { AccountModule } from 'src/endpoints/accounts/account.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TransactionModule,
    ShardModule,
    NodeModule,
    NftModule,
    NftWorkerModule,
    PersistenceModule,
    AccountModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    TransactionProcessorService,
  ],
})
export class TransactionProcessorModule { }
