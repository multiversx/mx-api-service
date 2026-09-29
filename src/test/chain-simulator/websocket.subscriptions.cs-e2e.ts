import axios from "axios";
import { config } from "./config/env.config";
import { fundAddress, issueMultipleEsdts, transferEgld, transferEsdt } from "./utils/chain.simulator.operations";
import { io, Socket } from "socket.io-client";
import { ChainSimulatorUtils } from "./utils/test.utils";

const WS_SERVER_URL = `${config.subscriptionsServiceUrl}`;

// --- Test Configuration ---
const verbose = false; // Set true for debugging logs

const client4SubscriptionConfig = {
  pool: { from: 0, size: 25 },
  events: { from: 0, size: 25, shard: 1 },
  transactions: { from: 0, size: 25, status: 'success' },
  blocks: { from: 0, size: 25, shard: 1 },
};
// --------------------------

const log = (...args: any[]) => {
  if (verbose) {
    console.log(...args);
  }
};

// the broadcaster can push the same round twice: when it times out waiting for the following round it
// does not advance its cursor, and replays from there on the next tick. a replayed item is identical
// to the original, so the responses are kept by identity and only the distinct ones are counted
const txResponses: Map<string, Map<string, any>> = new Map();
const eventResponses: Map<string, Map<string, any>> = new Map();
const transferResponses: Map<string, Map<string, any>> = new Map(); // New: Store transfers

const txKey = (tx: any) => tx.txHash;
const eventKey = (evt: any) => `${evt.txHash}:${evt.order}:${evt.identifier}`;

const collect = (target: Map<string, any>, items: any[], key: (item: any) => string) => {
  for (const item of items) {
    target.set(key(item), item);
  }
};

const received = (responses: Map<string, Map<string, any>>, filterKey: string) => [...(responses.get(filterKey)?.values() ?? [])];

const generalResponses = {
  pool: [] as any[],
  events: [] as any[],
  transactions: [] as any[],
  blocks: [] as any[],
  stats: [] as any[],
};

const txFilters = {
  CLIENT_1: { sender: config.aliceAddress },
  CLIENT_2: { sender: config.bobAddress },
  CLIENT_3: { sender: config.aliceAddress, receiver: config.bobAddress },
};

const eventFilters = {
  CLIENT_1: { identifier: 'pong' },
  CLIENT_2: { address: '' },
  CLIENT_3: { identifier: 'completedTxEvent', address: '' },
};

const transferFilters = {
  CLIENT_5: { address: config.aliceAddress }, // Filter by Address (Sender or Receiver)
  CLIENT_6: { token: 'EGLD', address: config.aliceAddress },                // Filter by EGLD only
  CLIENT_7: { token: '' },                    // Filter by specific ESDT (populated later)
};

const filterKeys = {
  CLIENT_1: "KEY_CLIENT_1",
  CLIENT_2: "KEY_CLIENT_2",
  CLIENT_3: "KEY_CLIENT_3",
  CLIENT_5: "KEY_CLIENT_5_ADDR",
  CLIENT_6: "KEY_CLIENT_6_EGLD",
  CLIENT_7: "KEY_CLIENT_7_ESDT",
};

// Map configuration to clients
const filterMap = [
  // TX & Event Clients
  { key: filterKeys.CLIENT_1, txFilter: txFilters.CLIENT_1, eventFilter: eventFilters.CLIENT_1, transferFilter: null, clientId: "client1" },
  { key: filterKeys.CLIENT_2, txFilter: txFilters.CLIENT_2, eventFilter: eventFilters.CLIENT_2, transferFilter: null, clientId: "client2" },
  { key: filterKeys.CLIENT_3, txFilter: txFilters.CLIENT_3, eventFilter: eventFilters.CLIENT_3, transferFilter: null, clientId: "client3" },

  // Transfer Clients
  { key: filterKeys.CLIENT_5, txFilter: null, eventFilter: null, transferFilter: transferFilters.CLIENT_5, clientId: "client5_addr" },
  { key: filterKeys.CLIENT_6, txFilter: null, eventFilter: null, transferFilter: transferFilters.CLIENT_6, clientId: "client6_egld" },
  { key: filterKeys.CLIENT_7, txFilter: null, eventFilter: null, transferFilter: transferFilters.CLIENT_7, clientId: "client7_esdt" },
];

let pingPongScAddress = '';
const aliceEsdts: string[] = [];

describe('Websocket subscriptions e2e tests', () => {
  const clients: Socket[] = [];
  const connectionErrors: string[] = [];
  const failedClients: Set<Socket> = new Set();
  const subscriptions: Promise<string | undefined>[] = [];

  // auto-reconnect is disabled on purpose: the subscriptions below are emitted from the 'connect'
  // handler, so every reconnect would re-subscribe. connections are instead retried explicitly, and
  // only once connect_error says the previous attempt is over: calling connect() while a handshake is
  // still in flight sends a second CONNECT packet, the server opens a second socket for it, and every
  // message then arrives twice
  const socketOptions = { path: '/ws/subscription', reconnection: false };

  const waitForConnections = async (timeoutMs: number) => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (clients.every(client => client.connected)) {
        return;
      }

      for (const client of failedClients) {
        failedClients.delete(client);
        client.connect();
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const pending = clients.filter(client => !client.connected).length;
    throw new Error(`${pending} of ${clients.length} websocket clients did not connect within ${timeoutMs}ms. Errors: ${connectionErrors.join('; ') || 'none reported'}`);
  };

  // a subscription that the server rejects is answered with an 'error' event and never acknowledged,
  // so the timeout is what reports it. the failure is resolved rather than rejected, since it may come
  // before anything awaits it and would otherwise surface as an unhandled rejection
  const subscribe = (client: Socket, clientId: string, event: string, ...args: any[]) => {
    const subscription = client.timeout(30000).emitWithAck(event, ...args).then(
      (ack: any) => {
        log(`   ACK ${event} ${clientId}:`, ack);
        return undefined;
      },
      () => `${clientId}: ${event} was not acknowledged`,
    );

    subscriptions.push(subscription);
  };

  // --- Connect Helper ---
  const connectClient = (clientId: string, onConnect: (client: Socket) => void) => {
    const client: Socket = io(WS_SERVER_URL, socketOptions);
    clients.push(client);

    // never throw from a socket callback: it escapes as an uncaughtException that jest attributes
    // to whichever test happens to be running, in any file. waitForConnections reports it instead
    client.on("connect_error", (err) => {
      connectionErrors.push(`${clientId}: ${err.message}`);
      failedClients.add(client);
    });

    let subscribed = false;
    client.on("connect", () => {
      log(`\n   ${clientId} connected.`);

      if (!subscribed) {
        subscribed = true;
        onConnect(client);
      }
    });

    return client;
  };

  // --- Subscribe Helpers ---
  const connectAndSubscribe = (
    filterKey: string,
    txFilter: any,
    eventFilter: any,
    transferFilter: any,
    clientId: string
  ) => {
    const receivedTxs: Map<string, any> = new Map();
    const receivedEvents: Map<string, any> = new Map();
    const receivedTransfers: Map<string, any> = new Map();

    txResponses.set(filterKey, receivedTxs);
    eventResponses.set(filterKey, receivedEvents);
    transferResponses.set(filterKey, receivedTransfers);

    const client = connectClient(clientId, (client) => {
      if (txFilter) {
        subscribe(client, clientId, "subscribeCustomTransactions", txFilter);
      }
      if (eventFilter) {
        subscribe(client, clientId, "subscribeCustomEvents", eventFilter);
      }
      if (transferFilter) {
        subscribe(client, clientId, "subscribeCustomTransfers", transferFilter);
      }
    });

    client.on("customTransactionUpdate", (data: { transactions: any[] }) => {
      log(`\n💸 ${clientId} received ${data.transactions.length} txs`);
      collect(receivedTxs, data.transactions, txKey);
    });

    client.on("customEventUpdate", (data: { events: any[] }) => {
      log(`\n🔔 ${clientId} received ${data.events.length} events`);
      collect(receivedEvents, data.events, eventKey);
    });

    client.on("customTransferUpdate", (data: { transfers: any[] }) => {
      log(`\n💎 ${clientId} received ${data.transfers.length} transfers`);
      collect(receivedTransfers, data.transfers, txKey);
    });
  };

  const connectAndSubscribeGeneral = (clientId: string, subConfig: typeof client4SubscriptionConfig) => {
    const client = connectClient(clientId, (client) => {
      subscribe(client, clientId, "subscribePool", subConfig.pool);
      subscribe(client, clientId, "subscribeEvents", subConfig.events);
      subscribe(client, clientId, "subscribeTransactions", subConfig.transactions);
      subscribe(client, clientId, "subscribeBlocks", subConfig.blocks);
      subscribe(client, clientId, "subscribeStats");
    });

    client.on("poolUpdate", (data: any) => generalResponses.pool.push(data));
    client.on("eventsUpdate", (data: any) => generalResponses.events.push(data));
    client.on("transactionUpdate", (data: any) => generalResponses.transactions.push(data));
    client.on("blocksUpdate", (data: any) => generalResponses.blocks.push(data));
    client.on("statsUpdate", (data: any) => generalResponses.stats.push(data));
  };

  beforeAll(async () => {
    try {
      await fundAddress(config.chainSimulatorUrl, config.aliceAddress);
      await fundAddress(config.chainSimulatorUrl, config.bobAddress);
      await axios.post(`${config.chainSimulatorUrl}/simulator/generate-blocks/1`);

      pingPongScAddress = await ChainSimulatorUtils.deployPingPongSc(config.bobAddress);
      eventFilters.CLIENT_2.address = pingPongScAddress;
      eventFilters.CLIENT_3.address = pingPongScAddress;

      log("Issuing ESDT Token...");
      const newAliceEsdts = await issueMultipleEsdts(config.chainSimulatorUrl, config.aliceAddress, 1);
      aliceEsdts.push(...newAliceEsdts);

      await axios.post(`${config.chainSimulatorUrl}/simulator/generate-blocks/10`);

      for (const item of filterMap) {
        if (item.key === filterKeys.CLIENT_7) {
          item.transferFilter = { token: aliceEsdts[0] };
        }
        connectAndSubscribe(item.key, item.txFilter, item.eventFilter, item.transferFilter, item.clientId);
      }

      connectAndSubscribeGeneral("client4", client4SubscriptionConfig);

      await waitForConnections(30000);

      // every client is connected, so every 'connect' handler has run and queued its subscriptions
      const subscriptionErrors = (await Promise.all(subscriptions)).filter(error => error !== undefined);
      if (subscriptionErrors.length > 0) {
        throw new Error(`Subscriptions failed: ${subscriptionErrors.join('; ')}`);
      }

      // the broadcaster starts from the latest round it sees on its first tick after the subscriptions
      // exist, and never goes back to the ones before it. give it time to take that position before
      // any operation produces blocks
      await new Promise(resolve => setTimeout(resolve, 10000));

      log("\n--- Starting Operations ---");


      await transferEgld(config.chainSimulatorUrl, config.aliceAddress, config.bobAddress, 1);
      await transferEgld(config.chainSimulatorUrl, config.bobAddress, config.aliceAddress, 2);

      await ChainSimulatorUtils.pingContract(config.aliceAddress, pingPongScAddress);
      await ChainSimulatorUtils.pongContract(config.aliceAddress, pingPongScAddress);

      await transferEsdt({
        chainSimulatorUrl: config.chainSimulatorUrl,
        sender: config.aliceAddress,
        receiver: config.bobAddress,
        tokenIdentifier: aliceEsdts[0],
        plainAmountOfTokens: 1,
      });

      await axios.post(`${config.chainSimulatorUrl}/simulator/generate-blocks/10`);

      log("Waiting for WS messages...");

      // the broadcaster commits its cursor only after it sees the round that follows the one it just
      // sent. a simulator that has stopped producing blocks never provides that round, so it times
      // out and replays the whole window on its next tick. one block per wait step keeps it moving,
      // which is why this is a loop of short sleeps rather than a single long one
      for (let i = 0; i < 30; i++) {
        await axios.post(`${config.chainSimulatorUrl}/simulator/generate-blocks/1`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (e: any) {
      console.error("Error in beforeAll:", e.message);
      throw e;
    }
  });

  afterAll(() => {
    // unconditionally: a client that is disconnected or mid-handshake would otherwise be skipped
    // and keep its handlers and timers alive for the rest of the run, which is shared (--runInBand)
    for (const client of clients) {
      client.removeAllListeners();
      client.disconnect();
      client.close();
    }

    clients.length = 0;
  });

  it('should receive TXs sent by Alice for Client 1', () => {
    const txs = received(txResponses, filterKeys.CLIENT_1);
    expect(txs.length).toBe(4);

    txs.forEach((tx) => {
      expect(tx.sender).toEqual(config.aliceAddress);
    });
  });

  it('should receive Events with identifier "pong" for Client 1', () => {
    const events = received(eventResponses, filterKeys.CLIENT_1);
    expect(events.length).toBe(1);

    events.forEach((evt) => {
      expect(evt.identifier).toEqual('pong');
    });
  });

  it('should receive TXs sent by Bob for Client 2', () => {
    const txs = received(txResponses, filterKeys.CLIENT_2);
    expect(txs.length).toBe(1);

    txs.forEach((tx) => {
      expect(tx.sender).toEqual(config.bobAddress);
    });
  });

  it('should receive Events generated by PingPong contract (address) for Client 2', () => {
    const events = received(eventResponses, filterKeys.CLIENT_2);
    expect(events.length).toBe(6);

    events.forEach((evt) => {
      expect(evt.address).toEqual(pingPongScAddress);
    });
  });

  it('should receive specific Alice-to-Bob TXs for Client 3', () => {
    const txs = received(txResponses, filterKeys.CLIENT_3);
    expect(txs.length).toBeGreaterThanOrEqual(1);
    txs.forEach((tx) => {
      expect(tx.sender).toEqual(config.aliceAddress);
      expect(tx.receiver).toEqual(config.bobAddress);
    });
  });

  it('should receive ANY transfer involving Alice (Client 5 - Address Filter)', () => {
    const transfers = received(transferResponses, filterKeys.CLIENT_5);
    expect(transfers.length).toBeGreaterThan(0);

    transfers.forEach(t => {
      const isAliceInvolved = t.sender === config.aliceAddress || t.receiver === config.aliceAddress;
      expect(isAliceInvolved).toBe(true);
    });
  });

  it('should receive ONLY EGLD transfers where ALICE is involved (Client 6 - Token EGLD Filter)', () => {
    const transfers = received(transferResponses, filterKeys.CLIENT_6);
    expect(transfers.length).toBeGreaterThan(0);

    transfers.forEach(t => {
      const val1 = `1${'0'.repeat(18)}`;
      const val2 = `2${'0'.repeat(18)}`;
      expect([val1, val2]).toContain(t.value);

      const isAliceInvolved =
        t.sender === config.aliceAddress ||
        t.receiver === config.aliceAddress ||
        t.relayer === config.aliceAddress;

      expect(isAliceInvolved).toBe(true);
    });
  });

  it('should receive ONLY specific ESDT transfers (Client 7 - Dynamic Token Filter)', () => {
    const transfers = received(transferResponses, filterKeys.CLIENT_7);
    expect(transfers.length).toBeGreaterThan(0);

    transfers.forEach(t => {
      const esdtTransfers = t.action?.arguments?.transfers;
      const containsAliceEsdt = esdtTransfers.filter((et: any) => et.token === aliceEsdts[0]).length > 0;
      expect(containsAliceEsdt).toBe(true);
    });
  });

  it('should receive Blocks updates for Client 4', () => {
    expect(generalResponses.blocks.length).toBeGreaterThan(0);
  });
  it('should receive Transactions updates for Client 4', () => {
    expect(generalResponses.transactions.length).toBeGreaterThan(0);
  });
  it('should receive Events updates for Client 4', () => {
    expect(generalResponses.events.length).toBeGreaterThan(0);
  });
  it('should receive Stats updates for Client 4', () => {
    expect(generalResponses.stats.length).toBeGreaterThan(0);
  });
  it('should have valid subscription structure for Pool updates', () => {
    expect(Array.isArray(generalResponses.pool)).toBe(true);
  });
});
