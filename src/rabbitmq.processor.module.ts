import { Module } from '@nestjs/common';
import { RabbitMqModule } from './common/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    RabbitMqModule.register(),
  ],
})
export class RabbitMqProcessorModule { }
