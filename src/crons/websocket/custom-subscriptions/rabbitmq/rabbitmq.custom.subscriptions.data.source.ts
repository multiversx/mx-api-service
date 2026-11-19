import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { CustomSubscriptionsBroadcaster } from '../custom.subscriptions.broadcaster';
import { ElasticCustomSubscriptionsDataSource } from '../elastic/elastic.custom.subscriptions.data.source';
import { IndexerBlock, IndexerRound } from '../entities';

@Injectable()
export class RabbitMqCustomSubscriptionsDataSource implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new OriginLogger(RabbitMqCustomSubscriptionsDataSource.name);

  private static readonly exchangeCheckIntervalMs = 5000;
  private static readonly messagesFlowCheckIntervalMs = 1000;

  private connection?: AmqpConnection;
  private isSubscribed = false;
  private isFallbackActive = false;
  private lastMessageAtMs = Date.now();
  private lastTimestampMs?: number;
  private minTimestampMs = 0;
  private exchangeCheckTimeout?: NodeJS.Timeout;
  private messagesFlowCheckInterval?: NodeJS.Timeout;

  constructor(
    private readonly broadcaster: CustomSubscriptionsBroadcaster,
    private readonly elasticDataSource: ElasticCustomSubscriptionsDataSource,
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

    this.lastMessageAtMs = Date.now();
    this.messagesFlowCheckInterval = setInterval(() => this.checkMessagesFlow(), RabbitMqCustomSubscriptionsDataSource.messagesFlowCheckIntervalMs);
  }

  async onModuleDestroy(): Promise<void> {
    clearTimeout(this.exchangeCheckTimeout);
    clearInterval(this.messagesFlowCheckInterval);
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

  checkMessagesFlow(): void {
    const fallbackAfterMs = this.apiConfigService.getWebsocketSubscriptionRabbitMqFallbackAfterMs();
    if (this.isFallbackActive || Date.now() - this.lastMessageAtMs < fallbackAfterMs) {
      return;
    }

    this.isFallbackActive = true;
    this.logger.warn(`No blocks received from RabbitMQ for ${fallbackAfterMs}ms, falling back to elastic`);

    this.elasticDataSource.start(this.lastTimestampMs);
  }

  async consumeBlock(block: IndexerBlock | undefined): Promise<void> {
    this.lastMessageAtMs = Date.now();

    try {
      const round = this.toIndexerRound(block);
      if (!round) {
        return;
      }

      if (this.isFallbackActive) {
        this.stopFallback(round.timestampMs);
      }

      this.lastTimestampMs = Math.max(this.lastTimestampMs ?? 0, round.timestampMs);

      if (round.timestampMs < this.minTimestampMs || !this.broadcaster.hasSubscriptions()) {
        return;
      }

      await this.broadcaster.broadcast(round);
    } catch (error) {
      this.logger.error(`An unhandled error occurred when consuming the block '${block?.hash}' from shard '${block?.shardID}'`);
      this.logger.error(error);
    }
  }

  private stopFallback(timestampMs: number): void {
    this.minTimestampMs = Math.max(timestampMs, this.elasticDataSource.getTimestampMsToProcess() ?? 0);
    this.elasticDataSource.stopAt(this.minTimestampMs);
    this.isFallbackActive = false;

    this.logger.log(`Blocks are received again from RabbitMQ, elastic stops at timestamp '${this.minTimestampMs}'`);
  }

  private toIndexerRound(block: IndexerBlock | undefined): IndexerRound | undefined {
    const operations = block?.operations ?? [];
    const events = block?.events ?? [];

    const firstItem = operations[0] ?? events[0];
    const timestampMs = firstItem?.timestampMs ?? firstItem?.timestamp * 1000;
    if (!timestampMs) {
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
