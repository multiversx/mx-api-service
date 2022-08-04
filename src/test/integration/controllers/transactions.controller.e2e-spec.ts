import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe.skip("Transactions Controller", () => {
  let app: INestApplication;
  const route: string = "/transactions";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });

  it("/transactions - should return 200 status code and one list of transaction", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/transactions?from&size - should return 200 status code and one list of 100 transaction", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '100',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&withLogs&withOperations&withScResults - should return 400 status code Bad Request. Request is limited to 50 if withScResults, withOperations, withLogs flags are active", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '100',
      'withScResults': 'true',
      'withOperations': 'true',
      'withLogs': 'true',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Maximum size of 50 is allowed when activating flags 'withScResults', 'withOperations' or 'withLogs'");
      });
  });

  it("/transactions?from&size&withScResults - should return 200 status code and transactions with smart contract results active", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'withScResults': 'true',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&withOperations - should return 200 status code and transactions withOperations active", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'withOperations': 'true',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&withLogs - should return 200 status code and transactions withLogs active", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'withLogs': 'true',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&condition - should return 200 status code and 50 transactions from elastic", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'condition': 'elastic',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&condition - should return 200 status code and 50 transactions from gateway", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'condition': 'gateway',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&asc - should return 200 status code and 50 transactions sorted ascending", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'order': 'asc',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&asc - should return 200 status code and 50 transactions sorted descending", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'order': 'desc',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&status - should return 200 status code and 50 success transactions", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'status': 'success',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&status - should return 200 status code and 50 pending transactions", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'status': 'pending',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&status - should return 200 status code and 50 fail transactions", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'status': 'fail',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&hashes - should return 200 status code and two transactions based on hashes filter", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
      'hashes': 'e21331bbc309d106d94d80e363b8b8fbf90bb6a3c2120cd6ef9b68dfd0b68703,16eb7a247ae7da0ea38fe632a7c61a92ff7358349cd7d78d32d4d2347244ede0',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&miniBlockHash - should return 200 status code and 1 transactions based on miniBlockHash filter", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '1',
      'miniBlockHash': '9d2e05143f57bdcd005589514e25057393650a001ef5f25743cb8313b8fd001d,16eb7a247ae7da0ea38fe632a7c61a92ff7358349cd7d78d32d4d2347244ede0',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&receiverHash - should return 200 status code and 1 transactions based on receiverShard filter", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '1',
      'receiverHash': '1',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&senderShard - should return 200 status code and 1 transactions based on senderShard filter", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '1',
      'senderShard': '1',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&senderShard&receiverHash - should return 200 status code and 1 transactions based on senderShard and receiverShard filter", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '1',
      'senderShard': '1',
      'receiverHash': '1',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?from&size&token - should return 200 status code and one list of transactions based on token filter", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '1',
      'token': 'WEGLD-bd4d79',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/transactions?token - should return 200 status code and transactions count for a specific token ", async () => {
    const params = new URLSearchParams({
      'token': 'WEGLD-bd4d79',
    });

    await request(app.getHttpServer())
      .get(route + "/count?" + params)
      .expect(200);
  });

  it("/transactions?status - should return 200 status code and transactions count for transaction with status success ", async () => {
    const params = new URLSearchParams({
      'status': 'success',
    });

    await request(app.getHttpServer())
      .get(route + "/count?" + params)
      .expect(200);
  });

  it("/transactions?status - should return 200 status code and transactions count for transaction with status pending ", async () => {
    const params = new URLSearchParams({
      'status': 'pending',
    });

    await request(app.getHttpServer())
      .get(route + "/count?" + params)
      .expect(200);
  });

  it("/transactions?status - should return 200 status code and transactions count for transaction with status fail ", async () => {
    const params = new URLSearchParams({
      'status': 'fail',
    });

    await request(app.getHttpServer())
      .get(route + "/count?" + params)
      .expect(200);
  });

  it("/transactions?status - should return 200 status code and transactions count for two hashes ", async () => {
    const params = new URLSearchParams({
      'hashes': 'e21331bbc309d106d94d80e363b8b8fbf90bb6a3c2120cd6ef9b68dfd0b68703,16eb7a247ae7da0ea38fe632a7c61a92ff7358349cd7d78d32d4d2347244ede0',
    });

    await request(app.getHttpServer())
      .get(route + "/count?" + params)
      .expect(200);
  });

  it("/transactions&status - should return 200 status code and transactions count for sender shard 0 ", async () => {
    const params = new URLSearchParams({
      'senderShard': '0',
    });

    await request(app.getHttpServer())
      .get(route + "/count?" + params)
      .expect(200);
  });

  it("/transactions?senderShard - should return 200 status code and transactions count for sender shard 1 ", async () => {
    const params = new URLSearchParams({
      'senderShard': '1',
    });

    await request(app.getHttpServer())
      .get(route + "/count?" + params)
      .expect(200);
  });

  it("/transactions?senderShard - should return 200 status code and transactions count for sender shard 2 ", async () => {
    const params = new URLSearchParams({
      'senderShard': '2',
    });

    await request(app.getHttpServer())
      .get(route + "/count?" + params)
      .expect(200);
  });

  it("/transactions?senderShard&receiverShard - should return 200 status code and transactions count for sender shard 0 and receiver shard 0 ", async () => {
    const params = new URLSearchParams({
      'senderShard': '0',
      'receiverShard': '0',
    });

    await request(app.getHttpServer())
      .get(route + "/count?" + params)
      .expect(200);
  });

  it("/transactions?token - should return 200 status code and transactions count for a specific token ", async () => {
    const params = new URLSearchParams({
      'token': 'WEGLD-bd4d79',
    });

    await request(app.getHttpServer())
      .get(route + "/count?" + params)
      .expect(200);
  });

  it("/transactions/:txHash - should return 200 status code and transaction details for a specific txHash ", async () => {
    const txHash: string = "0b1f62e44f4657182be6f6c263dbdeb0bf6d5efd603fe879027e9df2dec2192b";

    await request(app.getHttpServer())
      .get(route + "/" + txHash)
      .expect(200);
  });

  it("/transactions/:txHash - should return 404 status code Error: Not Found ", async () => {
    const txHash: string = "0b1f62e44f4657182be6f6c263dbdeb0bf6d5efd603fe879027e9df2dec2192bT";

    await request(app.getHttpServer())
      .get(route + "/" + txHash)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Transaction not found");
      });
  });
});
