import { CustomSubscriptionsBroadcaster } from 'src/crons/websocket/custom-subscriptions/custom.subscriptions.broadcaster';
import { IndexerRound } from 'src/crons/websocket/custom-subscriptions/indexer.round';
import { EventsCustomGateway } from 'src/crons/websocket/events.custom.gateway';
import { RoomKeyGenerator } from 'src/crons/websocket/room.key.generator';
import { TransactionsCustomGateway } from 'src/crons/websocket/transaction.custom.gateway';
import { TransfersCustomGateway } from 'src/crons/websocket/transfers.custom.gateway';
import { EventsService } from 'src/endpoints/events/events.service';
import { TransactionDetailed } from 'src/endpoints/transactions/entities/transaction.detailed';
import { TransactionType } from 'src/endpoints/transactions/entities/transaction.type';
import { TransferService } from 'src/endpoints/transfers/transfer.service';

describe('CustomSubscriptionsBroadcaster', () => {
  let rooms: Map<string, Set<string>>;
  let emitted: { roomName: string; event: string; payload: any }[];
  let processTransfers: jest.SpyInstance;
  let processRelayedInfo: jest.Mock;
  let transfersGateway: TransfersCustomGateway;
  let broadcaster: CustomSubscriptionsBroadcaster;

  const subscribe = (prefix: string, filter: Record<string, any>) => {
    rooms.set(`${prefix}${RoomKeyGenerator.deterministicStringify(filter)}`, new Set(['socket']));
  };

  const emittedTo = (prefix: string, filter: Record<string, any>) => {
    const roomName = `${prefix}${RoomKeyGenerator.deterministicStringify(filter)}`;
    return emitted.filter(emit => emit.roomName === roomName);
  };

  const operation = (txHash: string, sender: string, type: 'normal' | 'unsigned', extra: Record<string, any> = {}): any => {
    return { txHash, sender, receiver: 'bob', value: '0', type, timestamp: 1, nonce: 1, ...extra };
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    rooms = new Map();
    emitted = [];

    const transferService = new TransferService({} as any, {} as any);
    processTransfers = jest.spyOn(transferService, 'processTransfers').mockImplementation((transfers: TransactionDetailed[]) => {
      for (const transfer of transfers) {
        transfer.function = 'enriched';
      }

      return Promise.resolve();
    });

    processRelayedInfo = jest.fn();

    const server = {
      sockets: { adapter: { rooms } },
      to: (roomName: string) => ({ emit: (event: string, payload: any) => emitted.push({ roomName, event, payload }) }),
    };

    transfersGateway = new TransfersCustomGateway();
    const transactionsGateway = new TransactionsCustomGateway();
    const eventsGateway = new EventsCustomGateway();
    transfersGateway.server = server as any;
    transactionsGateway.server = server as any;
    eventsGateway.server = server as any;

    broadcaster = new CustomSubscriptionsBroadcaster(
      transferService,
      { processRelayedInfo } as any,
      new EventsService({} as any),
      { hasSubscriptionsWithPrefixes: () => true } as any,
      transfersGateway,
      transactionsGateway,
      eventsGateway,
    );
  });

  it('enriches only the transfers that match a subscription', async () => {
    subscribe(TransfersCustomGateway.keyPrefix, { sender: 'alice' });
    subscribe(TransfersCustomGateway.keyPrefix, { token: 'AAA-123456' });

    const round = new IndexerRound({
      timestampMs: 1000,
      operations: [
        operation('a', 'alice', 'normal'),
        operation('b', 'carol', 'unsigned', { tokens: ['AAA-123456'] }),
        operation('c', 'carol', 'normal', { tokens: ['BBB-123456'] }),
      ],
    });

    await broadcaster.broadcast(round);

    expect(processTransfers).toHaveBeenCalledTimes(1);
    expect(processTransfers.mock.calls[0][0].map((transfer: TransactionDetailed) => transfer.txHash).sort()).toEqual(['a', 'b']);

    const [aliceEmit] = emittedTo(TransfersCustomGateway.keyPrefix, { sender: 'alice' });
    expect(aliceEmit.payload.timestampMs).toBe(1000);
    expect(aliceEmit.payload.transfers.map((transfer: TransactionDetailed) => transfer.function)).toEqual(['enriched']);

    const [tokenEmit] = emittedTo(TransfersCustomGateway.keyPrefix, { token: 'AAA-123456' });
    expect(tokenEmit.payload.transfers.map((transfer: TransactionDetailed) => transfer.txHash)).toEqual(['b']);
    expect(tokenEmit.payload.transfers[0].type).toBe(TransactionType.SmartContractResult);
  });

  it('does not enrich anything when no transfer matches', async () => {
    subscribe(TransfersCustomGateway.keyPrefix, { sender: 'dave' });

    await broadcaster.broadcast(new IndexerRound({ operations: [operation('a', 'alice', 'normal')] }));

    expect(processTransfers).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('drops the operations that can be ignored', async () => {
    subscribe(TransfersCustomGateway.keyPrefix, { sender: 'alice' });

    await broadcaster.broadcast(new IndexerRound({ operations: [operation('a', 'alice', 'normal', { canBeIgnored: true })] }));

    expect(processTransfers).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('enriches a transfer once when it matches both transfers and transactions rooms', async () => {
    subscribe(TransfersCustomGateway.keyPrefix, { sender: 'alice' });
    subscribe(TransactionsCustomGateway.keyPrefix, { sender: 'alice' });

    await broadcaster.broadcast(new IndexerRound({ operations: [operation('a', 'alice', 'normal')] }));

    expect(processTransfers.mock.calls[0][0]).toHaveLength(1);

    const [transfer] = emittedTo(TransfersCustomGateway.keyPrefix, { sender: 'alice' })[0].payload.transfers;
    const [transaction] = emittedTo(TransactionsCustomGateway.keyPrefix, { sender: 'alice' })[0].payload.transactions;
    expect(transfer.type).toBe(TransactionType.Transaction);
    expect(transaction.type).toBeUndefined();
    expect(transaction.function).toBe('enriched');
  });

  it('broadcasts only normal operations on the transactions channel', async () => {
    subscribe(TransactionsCustomGateway.keyPrefix, { receiver: 'bob' });

    await broadcaster.broadcast(new IndexerRound({ operations: [operation('a', 'alice', 'normal'), operation('b', 'alice', 'unsigned')] }));

    const [emit] = emittedTo(TransactionsCustomGateway.keyPrefix, { receiver: 'bob' });
    expect(emit.event).toBe('customTransactionUpdate');
    expect(emit.payload.transactions.map((transaction: TransactionDetailed) => transaction.txHash)).toEqual(['a']);
  });

  it('retries the enrichment until it succeeds', async () => {
    jest.useFakeTimers();
    subscribe(TransfersCustomGateway.keyPrefix, { sender: 'alice' });
    processTransfers
      .mockRejectedValueOnce(new Error('redis unavailable'))
      .mockRejectedValueOnce(new Error('redis unavailable'));

    const broadcastPromise = broadcaster.broadcast(new IndexerRound({ operations: [operation('a', 'alice', 'normal')] }));
    await jest.runAllTimersAsync();
    await broadcastPromise;

    expect(processTransfers).toHaveBeenCalledTimes(3);
    expect(emittedTo(TransfersCustomGateway.keyPrefix, { sender: 'alice' })).toHaveLength(1);
  });

  it('skips the transfers but still broadcasts events when the enrichment fails after 3 retries', async () => {
    jest.useFakeTimers();
    subscribe(TransfersCustomGateway.keyPrefix, { sender: 'alice' });
    subscribe(EventsCustomGateway.keyPrefix, { identifier: 'swap' });
    processTransfers.mockRejectedValue(new Error('redis unavailable'));

    const round = new IndexerRound({
      operations: [operation('a', 'alice', 'normal')],
      events: [{ _id: 'e', identifier: 'swap' } as any],
    });

    const broadcastPromise = broadcaster.broadcast(round);
    await jest.runAllTimersAsync();
    await broadcastPromise;

    expect(processTransfers).toHaveBeenCalledTimes(4);
    expect(emitted.map(emit => emit.event)).toEqual(['customEventUpdate']);
    expect(emitted[0].payload.events[0].txHash).toBe('e');
  });

  it('still broadcasts the transactions when broadcasting the transfers fails', async () => {
    subscribe(TransfersCustomGateway.keyPrefix, { sender: 'alice' });
    subscribe(TransactionsCustomGateway.keyPrefix, { sender: 'alice' });
    jest.spyOn(transfersGateway, 'broadcast').mockImplementation(() => {
      throw new Error('adapter error');
    });

    await broadcaster.broadcast(new IndexerRound({ operations: [operation('a', 'alice', 'normal')] }));

    expect(emitted.map(emit => emit.event)).toEqual(['customTransactionUpdate']);
  });

  it('matches on the function exposed to clients, after the relayed info is applied', async () => {
    subscribe(TransfersCustomGateway.keyPrefix, { function: 'swap' });
    processRelayedInfo.mockImplementation((transfers: TransactionDetailed[]) => {
      for (const transfer of transfers) {
        if (transfer.txHash === 'deprecated') {
          transfer.function = undefined;
        }
      }
    });

    const round = new IndexerRound({
      operations: [
        operation('deprecated', 'alice', 'normal', { function: 'swap' }),
        operation('a', 'alice', 'normal', { function: 'swap' }),
      ],
    });

    await broadcaster.broadcast(round);

    const [emit] = emittedTo(TransfersCustomGateway.keyPrefix, { function: 'swap' });
    expect(emit.payload.transfers.map((transfer: TransactionDetailed) => transfer.txHash)).toEqual(['a']);
  });

  it('sends a transfer once to an address room, even when the address is both sender and receiver', async () => {
    subscribe(TransfersCustomGateway.keyPrefix, { address: 'bob' });

    await broadcaster.broadcast(new IndexerRound({ operations: [operation('a', 'bob', 'normal')] }));

    const [emit] = emittedTo(TransfersCustomGateway.keyPrefix, { address: 'bob' });
    expect(emit.payload.transfers.map((transfer: TransactionDetailed) => transfer.txHash)).toEqual(['a']);
  });
});
