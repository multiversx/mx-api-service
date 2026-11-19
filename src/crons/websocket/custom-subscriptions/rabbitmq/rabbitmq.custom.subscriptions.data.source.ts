import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { CustomSubscriptionsBroadcaster } from '../custom.subscriptions.broadcaster';
import { IndexerBlock, IndexerRound } from '../entities';

@Injectable()
export class RabbitMqCustomSubscriptionsDataSource implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new OriginLogger(RabbitMqCustomSubscriptionsDataSource.name);

  private static readonly exchangeCheckIntervalMs = 5000;

  private connection?: AmqpConnection;
  private isSubscribed = false;
  private exchangeCheckTimeout?: NodeJS.Timeout;

  constructor(
    private readonly broadcaster: CustomSubscriptionsBroadcaster,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  async onModuleInit(): Promise<void> {
    this.connection = new AmqpConnection({
      uri: this.apiConfigService.getWebsocketSubscriptionRabbitMqUrl(),
      enableDirectReplyTo: false,
      prefetchCount: 1,
      connectionInitOptions: { wait: false },
    });

    await this.connection.init();

    this.connection.managedConnection.on('connect', () => void this.subscribeWhenExchangeExists());
    if (this.connection.connected) {
      await this.subscribeWhenExchangeExists();
    }
  }

  async onModuleDestroy(): Promise<void> {
    clearTimeout(this.exchangeCheckTimeout);
    await this.connection?.close();
  }

  async subscribeWhenExchangeExists(): Promise<void> {
    clearTimeout(this.exchangeCheckTimeout);
    if (this.isSubscribed || !this.connection) {
      return;
    }

    const exchange = this.apiConfigService.getWebsocketSubscriptionRabbitMqExchange();

    const exchangeExists = await this.exchangeExists(exchange);
    if (this.isSubscribed) {
      return;
    }

    if (!exchangeExists) {
      this.logger.warn(`RabbitMQ exchange '${exchange}' is not available, checking again in ${RabbitMqCustomSubscriptionsDataSource.exchangeCheckIntervalMs}ms`);
      this.exchangeCheckTimeout = setTimeout(() => void this.subscribeWhenExchangeExists(), RabbitMqCustomSubscriptionsDataSource.exchangeCheckIntervalMs);
      return;
    }

    this.isSubscribed = true;

    await this.connection.createSubscriber(
      this.consumeBlock.bind(this),
      {
        exchange,
        routingKey: '',
        queueOptions: {
          exclusive: true,
          autoDelete: true,
          durable: false,
        },
      },
      'consumeBlock',
    );
  }

  private async exchangeExists(exchange: string): Promise<boolean> {
    try {
      const channel = await this.connection?.connection.createChannel();
      channel?.on('error', () => undefined);

      await channel?.checkExchange(exchange);
      await channel?.close();

      return channel !== undefined;
    } catch {
      return false;
    }
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

    const timestampMs = firstItem.timestampMs ?? firstItem.timestamp * 1000;
    if (!timestampMs) {
      this.logger.error(`Block '${block?.hash}' from shard '${block?.shardID}' has no timestamp`);
      return undefined;
    }

    for (const operation of operations) {
      operation.txHash = operation.hash;
      operation.function = operation.function ?? operation.operation;
    }

    for (const event of events) {
      event._id = event.id;
    }

    return new IndexerRound({ timestampMs, operations, events });
  }
}
