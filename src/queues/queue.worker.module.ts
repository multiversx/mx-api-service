import { Module } from '@nestjs/common';
import { PluginModule } from 'src/plugins/plugin.module';

@Module({
  imports: [
    PluginModule,
  ],
  controllers: [],
  providers: [],
})
export class QueueWorkerModule { }
