import { Injectable } from '@nestjs/common';
import { CompetingRabbitConsumer } from './rabbitmq.consumers';
import { NftCreateEvent } from './entities/nft/nft-create.event';
import { NftEventEnum } from './entities/nft/nft-events.enum';
import { RabbitMqNftHandlerService } from './rabbitmq.nft.handler.service';

@Injectable()
export class RabbitMqNftConsumer {
  constructor(
    private readonly nftHandlerService: RabbitMqNftHandlerService,
  ) { }

  @CompetingRabbitConsumer({
    // queueName: process.env.RABBITMQ_QUEUE,
    // exchange: process.env.RABBITMQ_EXCHANGE,
    queueName: 'dex_service',
    exchange: 'all_events',
  })
  async consumeEvents(rawEvents: any) {
    const events = rawEvents?.events;

    for (const rawEvent of events) {
      switch (rawEvent.identifier) {
        case NftEventEnum.ESDTNFTCreate:
          await this.nftHandlerService.handleNftCreateEvent(new NftCreateEvent(rawEvent));
          break;
      }
    }
  }
}
