import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './common/common.module';
import { EndpointsModule } from './endpoints/enpoints.module';
import { PubSubModule } from './pub.sub.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => CommonModule),
    forwardRef(() => EndpointsModule),
    PubSubModule
  ],
})
export class TransactionProcessorModule {}
