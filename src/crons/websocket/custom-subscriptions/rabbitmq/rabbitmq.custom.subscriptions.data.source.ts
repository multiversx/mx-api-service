import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { hostname } from 'os';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { CustomSubscriptionsBroadcaster } from '../custom.subscriptions.broadcaster';
import { IndexerBlock, IndexerRound } from '../entities';

@Injectable()
export class RabbitMqCustomSubscriptionsDataSource implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new OriginLogger(RabbitMqCustomSubscriptionsDataSource.name);

  private static readonly queueExpiresMs = 60_000;

  private connection?: AmqpConnection;

  constructor(
    private readonly broadcaster: CustomSubscriptionsBroadcaster,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  async onModuleInit(): Promise<void> {
    this.connection = new AmqpConnection({
      uri: this.apiConfigService.getWebsocketSubscriptionRabbitMqUrl(),
      enableDirectReplyTo: false,
    });

    await this.connection.init();

    await this.connection.createSubscriber(
      this.consumeBlock.bind(this),
      {
        exchange: this.apiConfigService.getWebsocketSubscriptionRabbitMqExchange(),
        routingKey: '',
        queue: `${this.apiConfigService.getWebsocketSubscriptionRabbitMqQueue()}-${hostname()}`,
        queueOptions: {
          durable: true,
          arguments: {
            'x-expires': RabbitMqCustomSubscriptionsDataSource.queueExpiresMs,
          },
        },
      },
      'consumeBlock',
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.close();
  }

  async consumeBlock(block: IndexerBlock | undefined): Promise<void> {
    try {
      if (!this.broadcaster.hasSubscriptions()) {
        return;
      }

      const round = this.toIndexerRound(block);
      if (!round) {
        return;
      }

      await this.broadcaster.broadcast(round);
    } catch (error) {
      this.logger.error(`An unhandled error occurred when consuming the block '${block?.hash}' from shard '${block?.shardID}'`);
      this.logger.error(error);
    }
  }

  private toIndexerRound(block: IndexerBlock | undefined): IndexerRound | undefined {
    const operations = block?.operations ?? [];
    const events = block?.events ?? [];

    const firstItem = operations[0] ?? events[0];
    if (!firstItem) {
      return undefined;
    }

    for (const operation of operations) {
      operation.txHash = operation.hash;
      operation.function = operation.function ?? operation.operation;
    }

    for (const event of events) {
      event._id = event.id;
    }

    return new IndexerRound({
      timestampMs: firstItem.timestampMs ?? firstItem.timestamp * 1000,
      operations,
      events,
    });
  }
}
