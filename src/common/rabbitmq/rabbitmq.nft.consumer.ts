import { Injectable } from '@nestjs/common';
import { CompetingRabbitConsumer } from './rabbitmq.consumers';
import { RabbitMqNftHandlerService } from './rabbitmq.nft.handler.service';
import configuration from 'config/configuration';
import { NotifierEvent as NotifierEvent } from './entities/notifier.event';
import { OriginLogger } from '@elrondnetwork/erdnest';

@Injectable()
export class RabbitMqNftConsumer {
  private readonly logger = new OriginLogger(RabbitMqNftConsumer.name);

  constructor(
    private readonly nftHandlerService: RabbitMqNftHandlerService,
  ) { }

  @CompetingRabbitConsumer({
    exchange: 'all_events',
    queueName: configuration().features?.eventsNotifier?.queue ?? 'api-process-logs-and-events',
    deadLetterExchange: configuration().features?.eventsNotifier?.dlx ?? 'api-process-logs-and-events-dlx',
  })
  async consumeEvents(rawEvents: any) {
    try {
      const events = rawEvents?.events;
      if (events) {
        await Promise.all(events.map((event: any) => this.handleEvent(event)));
      }
    } catch (error) {
      this.logger.error(`An unhandled error occurred when consuming events: ${JSON.stringify(rawEvents)}`);
      this.logger.error(error);
    }
  }

  private async handleEvent(event: NotifierEvent) {
    await this.nftHandlerService.handleNftCreateEvent(event) ??
      await this.nftHandlerService.handleNftUpdateAttributesEvent(event);
  }
}
