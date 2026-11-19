import { IndexerRound } from 'src/crons/websocket/custom-subscriptions/entities';
import { RabbitMqCustomSubscriptionsDataSource } from 'src/crons/websocket/custom-subscriptions/rabbitmq/rabbitmq.custom.subscriptions.data.source';

describe('RabbitMqCustomSubscriptionsDataSource', () => {
  let broadcaster: { hasSubscriptions: jest.Mock; broadcast: jest.Mock };
  let dataSource: RabbitMqCustomSubscriptionsDataSource;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1_000_000 });

    broadcaster = { hasSubscriptions: jest.fn().mockReturnValue(true), broadcast: jest.fn() };
    const apiConfigService = {
      getWebsocketSubscriptionRabbitMqExchange: () => 'indexer_blocks',
    };

    dataSource = new RabbitMqCustomSubscriptionsDataSource(broadcaster as any, apiConfigService as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const block = (operations: any[], events: any[]) => ({ shardID: 1, hash: 'block', round: 10, operations, events });

  const broadcastTimestamps = () => broadcaster.broadcast.mock.calls.map(([round]: [IndexerRound]) => round.timestampMs);

  describe('consumeBlock', () => {
    it('broadcasts the operations and the events of the block under their timestamp', async () => {
      await dataSource.consumeBlock(block(
        [{ hash: 'a', type: 'normal', operation: 'transfer', timestampMs: 1000 }],
        [{ id: 'e', identifier: 'ESDTTransfer', timestampMs: 1000 }],
      ));

      expect(broadcaster.broadcast).toHaveBeenCalledWith(new IndexerRound({
        timestampMs: 1000,
        operations: [{ hash: 'a', txHash: 'a', type: 'normal', operation: 'transfer', function: 'transfer', timestampMs: 1000 } as any],
        events: [{ id: 'e', _id: 'e', identifier: 'ESDTTransfer', timestampMs: 1000 } as any],
      }));
    });

    it('keeps the function of the operation when it is present', async () => {
      await dataSource.consumeBlock(block([{ hash: 'a', operation: 'transfer', function: 'swap', timestampMs: 1000 }], []));

      const [round] = broadcaster.broadcast.mock.calls[0];
      expect(round.operations[0].function).toBe('swap');
    });

    it('uses the timestamp in seconds when there is no timestamp in milliseconds', async () => {
      await dataSource.consumeBlock(block([], [{ id: 'e', timestamp: 2 }]));

      expect(broadcastTimestamps()).toEqual([2000]);
    });

    it('does not broadcast a block without a timestamp', async () => {
      await dataSource.consumeBlock(block([{ hash: 'a' }], []));

      expect(broadcaster.broadcast).not.toHaveBeenCalled();
    });

    it('does not broadcast an empty block', async () => {
      await dataSource.consumeBlock(block([], []));

      expect(broadcaster.broadcast).not.toHaveBeenCalled();
    });

    it('does not broadcast when there are no subscriptions', async () => {
      broadcaster.hasSubscriptions.mockReturnValue(false);

      await dataSource.consumeBlock(block([{ hash: 'a', timestampMs: 1000 }], []));

      expect(broadcaster.broadcast).not.toHaveBeenCalled();
    });

    it('does not throw when the broadcast fails', async () => {
      broadcaster.broadcast.mockRejectedValue(new Error('broadcast failed'));

      await expect(dataSource.consumeBlock(block([{ hash: 'a', timestampMs: 1000 }], []))).resolves.toBeUndefined();
    });
  });

  describe('subscribeWhenExchangeExists', () => {
    let channel: { on: jest.Mock; checkExchange: jest.Mock; close: jest.Mock };
    let createSubscriber: jest.Mock;

    beforeEach(() => {
      channel = { on: jest.fn(), checkExchange: jest.fn(), close: jest.fn() };
      createSubscriber = jest.fn();
      (dataSource as any).connection = { connection: { createChannel: jest.fn().mockResolvedValue(channel) }, createSubscriber };
    });

    it('binds an exclusive auto-delete queue to the exchange when it exists', async () => {
      await dataSource.subscribeWhenExchangeExists();
      await dataSource.subscribeWhenExchangeExists();

      expect(channel.checkExchange).toHaveBeenCalledWith('indexer_blocks');
      expect(createSubscriber).toHaveBeenCalledTimes(1);
      expect(createSubscriber.mock.calls[0][1]).toEqual({
        exchange: 'indexer_blocks',
        routingKey: '',
        queueOptions: { exclusive: true, autoDelete: true, durable: false },
      });
    });

    it('checks the exchange again later when it does not exist', async () => {
      channel.checkExchange.mockRejectedValueOnce(new Error('NOT_FOUND'));

      await dataSource.subscribeWhenExchangeExists();

      expect(createSubscriber).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(5000);

      expect(createSubscriber).toHaveBeenCalledTimes(1);
    });
  });
});
