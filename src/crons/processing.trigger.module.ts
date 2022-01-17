import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NftWorkerModule } from 'src/queue.worker/nft.worker/nft.worker.module';
import { CollectionModule } from 'src/endpoints/collections/collection.module';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { ProcessingTriggerService } from './processing.trigger.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NftWorkerModule,
    NftModule,
    CollectionModule,
  ],
  providers: [
    ProcessingTriggerService,
  ],
})
export class ProcessingTriggerModule { }
