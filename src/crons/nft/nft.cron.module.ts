import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NftWorkerModule } from 'src/queue.worker/nft.worker/nft.worker.module';
import { CollectionModule } from 'src/endpoints/collections/collection.module';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { NftCronService } from './nft.cron.service';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NftWorkerModule,
    NftModule,
    CollectionModule,
    DynamicModuleUtils.getCachingModule(),
  ],
  providers: [
    NftCronService,
  ],
})
export class NftCronModule { }
