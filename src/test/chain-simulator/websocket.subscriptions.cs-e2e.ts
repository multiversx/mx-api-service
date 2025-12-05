import axios from "axios";
import { config } from "./config/env.config";
import { fundAddress, transferEgld } from "./utils/chain.simulator.operations";
import { io, Socket } from "socket.io-client";

const WS_SERVER_URL = `${config.subscriptionsServiceUrl}`;

const subscriptionsResponses: Map<string, any[]> = new Map();

const filters = {
  CLIENT_1: { sender: config.aliceAddress },
  CLIENT_2: { sender: config.bobAddress },
  CLIENT_3: { sender: config.aliceAddress, receiver: config.bobAddress }
};

const filterKeys = {
  CLIENT_1: JSON.stringify(filters.CLIENT_1),
  CLIENT_2: JSON.stringify(filters.CLIENT_2),
  CLIENT_3: JSON.stringify(filters.CLIENT_3)
}

const filterMap = [
  { key: filterKeys.CLIENT_1, filter: filters.CLIENT_1, clientId: "client1" },
  { key: filterKeys.CLIENT_2, filter: filters.CLIENT_2, clientId: "client2" },
  { key: filterKeys.CLIENT_3, filter: filters.CLIENT_3, clientId: "client3" }
];


describe('Websocket subscriptions e2e tests with chain simulator', () => {
  jest.setTimeout(100000);

  const clients: Socket[] = [];

  const connectAndSubscribe = (filterKey: string, filter: any, clientId: string) => {
    const clientLabel = clientId;
    const receivedTxs: any[] = [];

    subscriptionsResponses.set(filterKey, receivedTxs);

    const client: Socket = io(WS_SERVER_URL, {
      path: '/ws/subscription'
    });
    clients.push(client);



    client.on("connect_error", (err) => {
      throw new Error(`${clientLabel} connection failed: ${err.message}`);
    });

    client.on("error", (err) => {
      throw new Error(`Error for ${clientLabel}: ${err.message}`);
    });

    client.on("customTransactionUpdate", (data: { transactions: any[] }) => {
      console.log(`\n💸 ${clientLabel} received ${data.transactions.length} txs`);
      receivedTxs.push(...data.transactions);
    });

    client.on("connect", () => {
      console.log(`\n   ${clientLabel} subscribing to TXs:`, JSON.stringify(filter));

      client.emit("subscribeCustomTransactions", filter, (ack: any) => {
        console.log('ACK Response:', ack);
      });
    });

  };

  beforeAll(async () => {
    console.log("--- Executing beforeAll (Setup) ---");

    try {
      // 1. Setup Chain Simulator
      await fundAddress(config.chainSimulatorUrl, config.aliceAddress);
      await fundAddress(config.chainSimulatorUrl, config.bobAddress);
      await axios.post(`${config.chainSimulatorUrl}/simulator/generate-blocks/1`);

      for (const item of filterMap) {
        connectAndSubscribe(item.key, item.filter, item.clientId);
      }

      // await for clients to connect
      console.log(`Awaiting for clients to connect...`)
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log("\n--- Starting Transactions ---");

      await transferEgld(config.chainSimulatorUrl, config.aliceAddress, config.bobAddress, 1);
      await transferEgld(config.chainSimulatorUrl, config.bobAddress, config.aliceAddress, 2);

      console.log("--- Generating Block and waiting for WS responses ---");
      await axios.post(`${config.chainSimulatorUrl}/simulator/generate-blocks/10`);

      await new Promise(resolve => setTimeout(resolve, 15000));

      console.log("--- Setup Complete ---");

    } catch (e: any) {
      console.error("An error occured in beforeAll:", e.message);

      throw e;
    }
  });

  afterAll(() => {
    clients.forEach(client => client.connected && client.disconnect());
    console.log("\n--- All clients disconnected ---");
  });

  // --- TESTE SEPARATE (itShould...) ---

  it('should receive only the transaction sent by Alice (Tx 1: Alice -> Bob) when filtering by CLIENT_1', () => {
    const filterKey = filterKeys.CLIENT_1;
    const aliceTxs = subscriptionsResponses.get(filterKey);
    console.log(`\nRunning test for ${filterMap.find(f => f.key === filterKey)?.clientId}`);

    expect(aliceTxs?.length).toBe(1);
    const tx = aliceTxs?.[0];
    expect(tx.sender).toEqual(config.aliceAddress);
    expect(tx.sender).not.toEqual(config.bobAddress);
  });

  it('should receive only the transaction sent by Bob (Tx 2: Bob -> Alice) when filtering by CLIENT_2', () => {
    const filterKey = filterKeys.CLIENT_2;
    const bobTxs = subscriptionsResponses.get(filterKey);
    console.log(`\nRunning test for ${filterMap.find(f => f.key === filterKey)?.clientId}`);

    expect(bobTxs?.length).toBe(1);
    const tx = bobTxs?.[0];
    expect(tx.sender).toEqual(config.bobAddress);
    expect(tx.receiver).toEqual(config.aliceAddress);
    expect(tx.sender).not.toEqual(config.aliceAddress);
  });

  it('should receive only the transaction sent by Alice to Bob (Tx 1) when filtering by CLIENT_3', () => {
    const filterKey = filterKeys.CLIENT_3;
    const aliceToBobTxs = subscriptionsResponses.get(filterKey);
    console.log(`\nRunning test for ${filterMap.find(f => f.key === filterKey)?.clientId}`);

    expect(aliceToBobTxs?.length).toBe(1);
    const tx = aliceToBobTxs?.[0];
    expect(tx.sender).toEqual(config.aliceAddress);
    expect(tx.receiver).toEqual(config.bobAddress);
  });
});