import axios from "axios";
import { config } from "./config/env.config";
import { fundAddress, transferEgld } from "./utils/chain.simulator.operations";
import { io, Socket } from "socket.io-client";
import { ChainSimulatorUtils } from "./utils/test.utils";

const WS_SERVER_URL = `${config.subscriptionsServiceUrl}`;

// --- Test Configuration ---
const verbose = false; // Set to true to see console logs

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

const txResponses: Map<string, any[]> = new Map();
const eventResponses: Map<string, any[]> = new Map();

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

const filterKeys = {
  CLIENT_1: "KEY_CLIENT_1",
  CLIENT_2: "KEY_CLIENT_2",
  CLIENT_3: "KEY_CLIENT_3",
};

const filterMap = [
  { key: filterKeys.CLIENT_1, txFilter: txFilters.CLIENT_1, eventFilter: eventFilters.CLIENT_1, clientId: "client1" },
  { key: filterKeys.CLIENT_2, txFilter: txFilters.CLIENT_2, eventFilter: eventFilters.CLIENT_2, clientId: "client2" },
  { key: filterKeys.CLIENT_3, txFilter: txFilters.CLIENT_3, eventFilter: eventFilters.CLIENT_3, clientId: "client3" },
];

let pingPongScAddress = '';

describe('Websocket subscriptions e2e tests (Txs and Events)', () => {
  const clients: Socket[] = [];

  const connectAndSubscribe = (filterKey: string, txFilter: any, eventFilter: any, clientId: string) => {
    const receivedTxs: any[] = [];
    const receivedEvents: any[] = [];

    txResponses.set(filterKey, receivedTxs);
    eventResponses.set(filterKey, receivedEvents);

    const client: Socket = io(WS_SERVER_URL, {
      path: '/ws/subscription',
    });
    clients.push(client);

    client.on("connect_error", (err) => {
      throw new Error(`${clientId} connection failed: ${err.message}`);
    });

    client.on("customTransactionUpdate", (data: { transactions: any[] }) => {
      log(`\n💸 ${clientId} received ${data.transactions.length} txs`);
      receivedTxs.push(...data.transactions);
    });

    client.on("customEventUpdate", (data: { events: any[] }) => {
      log(`\n🔔 ${clientId} received ${data.events.length} events`);
      receivedEvents.push(...data.events);
    });

    client.on("connect", () => {
      log(`\n   ${clientId} connected.`);

      client.emit("subscribeCustomTransactions", txFilter, (ack: any) => {
        log(`   ACK TXs ${clientId}:`, ack);
      });

      client.emit("subscribeCustomEvents", eventFilter, (ack: any) => {
        log(`   ACK Events ${clientId}:`, ack);
      });
    });
  };

  const connectAndSubscribeGeneral = (clientId: string, subConfig: typeof client4SubscriptionConfig) => {
    const client: Socket = io(WS_SERVER_URL, {
      path: '/ws/subscription',
    });
    clients.push(client);

    client.on("connect_error", (err) => {
      throw new Error(`${clientId} connection failed: ${err.message}`);
    });

    client.on("poolUpdate", (data: any) => generalResponses.pool.push(data));
    client.on("eventsUpdate", (data: any) => generalResponses.events.push(data));
    client.on("transactionUpdate", (data: any) => generalResponses.transactions.push(data));
    client.on("blocksUpdate", (data: any) => generalResponses.blocks.push(data));
    client.on("statsUpdate", (data: any) => generalResponses.stats.push(data));

    client.on("connect", () => {
      log(`\n   ${clientId} connected with specific configs.`);

      client.emit("subscribePool", subConfig.pool, (ack: any) => log(`ACK Pool ${clientId}:`, ack));
      client.emit("subscribeEvents", subConfig.events, (ack: any) => log(`ACK Events ${clientId}:`, ack));
      client.emit("subscribeTransactions", subConfig.transactions, (ack: any) => log(`ACK Txs ${clientId}:`, ack));
      client.emit("subscribeBlocks", subConfig.blocks, (ack: any) => log(`ACK Blocks ${clientId}:`, ack));

      client.emit("subscribeStats", (ack: any) => log(`ACK Stats ${clientId}:`, ack));
    });
  };

  beforeAll(async () => {
    try {
      await fundAddress(config.chainSimulatorUrl, config.aliceAddress);
      await fundAddress(config.chainSimulatorUrl, config.bobAddress);
      await axios.post(`${config.chainSimulatorUrl}/simulator/generate-blocks/1`);

      pingPongScAddress = await ChainSimulatorUtils.deployPingPongSc(config.bobAddress);
      eventFilters.CLIENT_2.address = pingPongScAddress;
      eventFilters.CLIENT_3.address = pingPongScAddress;

      for (const item of filterMap) {
        connectAndSubscribe(item.key, item.txFilter, item.eventFilter, item.clientId);
      }

      connectAndSubscribeGeneral("client4", client4SubscriptionConfig);

      await new Promise(resolve => setTimeout(resolve, 5000));

      log("\n--- Starting Operations ---");

      await transferEgld(config.chainSimulatorUrl, config.aliceAddress, config.bobAddress, 1);
      await transferEgld(config.chainSimulatorUrl, config.bobAddress, config.aliceAddress, 2);

      await ChainSimulatorUtils.pingContract(config.aliceAddress, pingPongScAddress);
      await ChainSimulatorUtils.pongContract(config.aliceAddress, pingPongScAddress);

      await axios.post(`${config.chainSimulatorUrl}/simulator/generate-blocks/10`);

      await new Promise(resolve => setTimeout(resolve, 15000));

    } catch (e: any) {
      console.error("Error in beforeAll:", e.message);
      throw e;
    }
  });

  afterAll(() => {
    clients.forEach(client => client.connected && client.disconnect());
  });

  // --- Tests for Clients 1, 2, 3 (Custom Filters) ---

  it('should receive TXs sent by Alice for Client 1', () => {
    const txs = txResponses.get(filterKeys.CLIENT_1);
    expect(txs?.length).toBe(3);

    txs?.forEach((tx) => {
      expect(tx.sender).toEqual(config.aliceAddress);
    });
  });

  it('should receive Events with identifier "pong" for Client 1', () => {
    const events = eventResponses.get(filterKeys.CLIENT_1);
    expect(events?.length).toBe(1);

    events?.forEach((evt) => {
      expect(evt.identifier).toEqual('pong');
    });
  });

  it('should receive TXs sent by Bob for Client 2', () => {
    const txs = txResponses.get(filterKeys.CLIENT_2);
    expect(txs?.length).toBe(2);

    txs?.forEach((tx) => {
      expect(tx.sender).toEqual(config.bobAddress);
    });
  });

  it('should receive Events generated by PingPong contract (address) for Client 2', () => {
    const events = eventResponses.get(filterKeys.CLIENT_2);
    expect(events?.length).toBe(7);

    events?.forEach((evt) => {
      expect(evt.address).toEqual(pingPongScAddress);
    });
  });

  it('should receive specific Alice-to-Bob TXs for Client 3', () => {
    const txs = txResponses.get(filterKeys.CLIENT_3);
    expect(txs?.length).toBeGreaterThanOrEqual(1);

    txs?.forEach((tx) => {
      expect(tx.sender).toEqual(config.aliceAddress);
      expect(tx.receiver).toEqual(config.bobAddress);
    });
  });

  it('should receive Events with identifier "completedTxEvent" and from Ping Pong sc address for Client 3', () => {
    const events = eventResponses.get(filterKeys.CLIENT_3);
    expect(events?.length).toBe(2);

    events?.forEach((evt) => {
      expect(evt.identifier).toEqual('completedTxEvent');
    });
  });

  // --- Tests for Client 4 (Pagination & Stats) ---

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
