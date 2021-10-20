import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from 'src/common/common.module';
import { MetricsModule } from 'src/common/metrics/metrics.module';
import { NodeModule } from 'src/endpoints/nodes/node.module';
import { ShardModule } from 'src/endpoints/shards/shard.module';
import { TransactionModule } from 'src/endpoints/transactions/transaction.module';
import { MicroserviceModule } from 'src/microservice.module';
import { EventsGateway } from 'src/websockets/events.gateway';
import { TransactionProcessorService } from './transaction.processor.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => CommonModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => MetricsModule),
    forwardRef(() => ShardModule),
    forwardRef(() => NodeModule),
    MicroserviceModule,
  ],
  providers: [
    TransactionProcessorService, EventsGateway,
  ],
})
export class TransactionProcessorModule {}
