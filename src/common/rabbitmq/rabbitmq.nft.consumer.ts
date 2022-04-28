import { Injectable, Logger } from '@nestjs/common';
import { CompetingRabbitConsumer } from './rabbitmq.consumers';
import { NftCreateEvent } from './entities/nft/nft-create.event';
import { NftEventEnum } from './entities/nft/nft-events.enum';
import { RabbitMqNftHandlerService } from './rabbitmq.nft.handler.service';
import configuration from 'config/configuration';

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
    queueName: configuration().features?.eventsNotifier?.queue ?? 'api-process-logs-and-events',
  })
  async consumeEvents(rawEvents: any) {
    try {
      const events = rawEvents?.events;

      await Promise.all(events.map((event: any) => this.handleEvent(event)));
    } catch (error) {
      this.logger.error(`An unhandled error occurred when consuming events: ${JSON.stringify(rawEvents)}`);
      this.logger.error(error);
    }
  }

  private async handleEvent(rawEvent: any) {
    switch (rawEvent.identifier) {
      case NftEventEnum.ESDTNFTCreate:
        await this.nftHandlerService.handleNftCreateEvent(new NftCreateEvent(rawEvent));
        break;
    }
  }
}
