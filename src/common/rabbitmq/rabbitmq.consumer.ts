import { Injectable } from '@nestjs/common';
import { CompetingRabbitConsumer } from './rabbitmq.consumers';
import { RabbitMqNftHandlerService } from './rabbitmq.nft.handler.service';
import configuration from 'config/configuration';
import { NotifierEvent as NotifierEvent } from './entities/notifier.event';
import { NftNotifierEventIdentifier } from './entities/notifier.event.identifier';
import { RabbitMqTokenHandlerService } from './rabbitmq.token.handler.service';
import { OriginLogger } from '@multiversx/sdk-nestjs';
import { RabbitMqEventsHandlerService } from './rabbitmq.events.handler.service';
import { ApiConfigService } from '../api-config/api.config.service';

@Injectable()
export class RabbitMqConsumer {
  private readonly logger = new OriginLogger(RabbitMqConsumer.name);
  private isLiveWsEnabled: boolean = false;

  constructor(
    private readonly nftHandlerService: RabbitMqNftHandlerService,
    private readonly tokenHandlerService: RabbitMqTokenHandlerService,
    private readonly eventsHandlerService: RabbitMqEventsHandlerService,
    private readonly apiConfigService: ApiConfigService,
  ) {
    this.isLiveWsEnabled = this.apiConfigService.isLiveWebsocketEventsFeatureEnabled();
  }

  @CompetingRabbitConsumer({
    exchange: 'all_events',
    queueName: configuration().features?.eventsNotifier?.queue ?? 'api-process-logs-and-events',
    deadLetterExchange: configuration().features?.eventsNotifier?.dlx ?? 'api-process-logs-and-events-dlx',
  })
  async consumeEvents(rawEvents: any) {
    try {
      const events = rawEvents?.events;

      this.isLiveWsEnabled && await this.eventsHandlerService.sendNotification(rawEvents);

      if (events) {
        await Promise.all(events.map((event: any) => this.handleEvent(event)));
      }
    } catch (error) {
      this.logger.error(`An unhandled error occurred when consuming events: ${JSON.stringify(rawEvents)}`);
      this.logger.error(error);
    }
  }

  private async handleEvent(event: NotifierEvent): Promise<void> {
    switch (event.identifier) {
      case NftNotifierEventIdentifier.ESDTNFTCreate:
        await this.nftHandlerService.handleNftCreateEvent(event);
        break;
      case NftNotifierEventIdentifier.ESDTNFTUpdateAttributes:
        await this.nftHandlerService.handleNftUpdateAttributesEvent(event);
        break;
      case NftNotifierEventIdentifier.transferOwnership:
        await this.tokenHandlerService.handleTransferOwnershipEvent(event);
        break;
    }
  }
}
