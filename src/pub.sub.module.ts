import { Module } from '@nestjs/common';
import { CacheController } from './endpoints/cache/cache.controller';
import { PublicAppModule } from './public.app.module';

@Module({
  imports: [
    PublicAppModule
  ],
  controllers: [
    CacheController
  ],
  providers: [
    
  ],
})
export class PubSubModule {}
