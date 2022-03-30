import { Injectable, Logger } from '@nestjs/common';
import { CompetingRabbitConsumer } from './rabbitmq.consumers';
import { NftCreateEvent } from './entities/nft/nft-create.event';
import { NftEventEnum } from './entities/nft/nft-events.enum';
import { RabbitMqNftHandlerService } from './rabbitmq.nft.handler.service';

@Injectable()
export class RabbitMqNftConsumer {
  private readonly logger: Logger;

  constructor(
    private readonly nftHandlerService: RabbitMqNftHandlerService,
  ) {
    this.logger = new Logger(RabbitMqNftConsumer.name);
  }

  @CompetingRabbitConsumer({
    exchange: 'all_events',
    queueName: 'api_service',
  })
  async consumeEvents(rawEvents: any) {
    try {
      const events = rawEvents?.events;

      for (const rawEvent of events) {
        switch (rawEvent.identifier) {
          case NftEventEnum.ESDTNFTCreate:
            await this.nftHandlerService.handleNftCreateEvent(new NftCreateEvent(rawEvent));
            break;
        }
      }
    } catch (error) {
      this.logger.error(`An unhandled error occurred when consuming events: ${JSON.stringify(rawEvents)}`);
      this.logger.error(error);
    }
  }
}
