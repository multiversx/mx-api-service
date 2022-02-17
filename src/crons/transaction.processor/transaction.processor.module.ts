import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from 'src/common/metrics/metrics.module';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { NodeModule } from 'src/endpoints/nodes/node.module';
import { ShardModule } from 'src/endpoints/shards/shard.module';
import { TransactionModule } from 'src/endpoints/transactions/transaction.module';
import { NftWorkerModule } from 'src/queue.worker/nft.worker/nft.worker.module';
import { EventsGateway } from 'src/websockets/events.gateway';
import { TransactionProcessorService } from './transaction.processor.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => TransactionModule),
    forwardRef(() => MetricsModule),
    forwardRef(() => ShardModule),
    forwardRef(() => NodeModule),
    forwardRef(() => NftModule),
    NftWorkerModule,
  ],
  providers: [
    TransactionProcessorService, EventsGateway,
  ],
})
export class TransactionProcessorModule { }
