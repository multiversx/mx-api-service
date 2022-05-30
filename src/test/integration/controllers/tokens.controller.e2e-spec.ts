import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Tokens Controller", () => {
  let app: INestApplication;
  const route: string = "/tokens";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });

  it("/tokens - should return 200 status code and one list of tokens", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/tokens?from&size - should return 200 status code and one list of 100 tokens", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '100',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/tokens?identifiers - should return 200 status code and one list of two tokens based on identifiers query", async () => {
    const params = new URLSearchParams({
      'identifiers': 'WEGLD-bd4d79,RIDE-7d18e9',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/tokens?identifier - should return 200 status code and one list of one token based on identifier query", async () => {
    const params = new URLSearchParams({
      'identifier': 'WEGLD-bd4d79',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/tokens?name - should return 200 status code and one list of one token based on name query", async () => {
    const params = new URLSearchParams({
      'name': 'WrappedEGLD',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/tokens/count - should return 200 status code and total tokens count", async () => {
    await request(app.getHttpServer())
      .get(route + "/count")
      .expect(200);
  });

  it("/tokens/count?identifiers - should return 200 status code and total tokens count based on multiple tokens identifiers query", async () => {
    const params = new URLSearchParams({
      'identifiers': 'WEGLD-bd4d79,RIDE-7d18e9',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/tokens/count?identifiers - should return 200 status code and total tokens count based on token identifier query", async () => {
    const params = new URLSearchParams({
      'identifiers': 'WEGLD-bd4d79',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/tokens/count?identifiers - should return 200 status code and total tokens count based on token name query", async () => {
    const params = new URLSearchParams({
      'name': 'WrappedEGLD',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/tokens/count/:identifier - should return 200 status code and token details based on token identifier query", async () => {
    const identifier: string = "WEGLD-bd4d79";
    await request(app.getHttpServer())
      .get(route + "/" + identifier)
      .expect(200);
  });

  it("/tokens/count/:identifier - should return 404 status code Error: Token not found", async () => {
    const identifier: string = "WEGLD-bd4d79Test";
    await request(app.getHttpServer())
      .get(route + "/" + identifier)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Token not found");
      });
  });

  it("/tokens/count/:identifiers/supply - should return 200 status code and token supply details based on token identifier query", async () => {
    const identifier: string = "WEGLD-bd4d79";
    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/supply")
      .expect(200);
  });

  it("/tokens/count/:identifiers/supply - should return 404 status code Error: Not Found", async () => {
    const identifier: string = "WEGLD-bd4d79Test";
    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/supply")
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Token not found");
      });
  });

  it("/tokens/count/:identifiers/accounts - should return 200 status code and token accounts details based on token identifier query", async () => {
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/accounts")
      .expect(200);
  });

  it("/tokens/count/:identifiers/accounts/count - should return 200 status code and total token accounts count details based on token identifier query", async () => {
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/accounts" + "/count")
      .expect(200);
  });


  it("/tokens/count/:identifiers/accounts?from&size - should return 200 status code and 100 tokens accounts details based on token identifier query", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '100',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/accounts" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/transactions - should return 200 status code and transactions details for a specific token", async () => {
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions")
      .expect(200);
  });

  it("/tokens/:identifiers/transactions?from&size - should return 200 status code and 100 transactions details for a specific token", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '100',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/transactions?from&size&withLogs&withOperations&order - should return 200 status code and 50 transactions details with logs, withoperations and ordered asc for a specific token", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'withLogs': 'true',
      'withOperations': 'true',
      'order': 'asc',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/transactions?from&size&status - should return 200 status code and 50 transactions details with status success for a specific token", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'status': 'success',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/transactions?from&size&status - should return 200 status code and 10 transactions details with status pending for a specific token", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
      'status': 'pending',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/transactions?from&size&status - should return 200 status code and 10 transactions details with status invalid for a specific token", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
      'status': 'fail',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/transactions?from&size&withLogs&withOperations&withScResults - should return 400 status code, maximum size of 50 is allowed when flags are active", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '100',
      'withLogs': 'true',
      'withOperations': 'true',
      'withScResults': 'true',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "?" + params)
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Maximum size of 50 is allowed when activating flags 'withScResults', 'withOperations' or 'withLogs'");
      });
  });

  it("/tokens/:identifiers/transactions/count - should return 200 status code and total transactions count", async () => {
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "/count")
      .expect(200);
  });

  // it("/tokens/{identifiers}/transactions/count - should return 400 status code Error: Not Found if token is not found", async () => {
  //   const identifier: string = "WEGLD-bd4d79T"

  //   await request(app.getHttpServer())
  //     .get(route + "/" + identifier + "/transactions" + "/count")
  //     .expect(404)
  //     .then(res => {
  //       expect(res.body.message).toEqual("Token not found");
  //     });
  // });

  it("/tokens/:identifiers/transactions/count?status - should return 200 status code and total success transactions count", async () => {
    const params = new URLSearchParams({
      'status': 'success',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "/count" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/transactions/count?status - should return 200 status code and total pending transactions count", async () => {
    const params = new URLSearchParams({
      'status': 'pending',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "/count" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/transactions/count?status - should return 200 status code and total fail transactions count", async () => {
    const params = new URLSearchParams({
      'status': 'fail',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "/count" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/transactions/count?senderShard&receiverShard - should return 200 status code and total transactions count for shard 0", async () => {
    const params = new URLSearchParams({
      'senderShard': '0',
      'receiverShard': '0',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "/count" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/transactions/count?senderShard&receiverShard - should return 200 status code and total transactions count for senderShard 0 and receiver shard 1", async () => {
    const params = new URLSearchParams({
      'senderShard': '0',
      'receiverShard': '1',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "/count" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/transactions/count?miniBlockHash - should return 200 status code and total transactions count for a specific miniBlockHash", async () => {
    const params = new URLSearchParams({
      'miniBlockHash': '4ab87e21dcf63f3d88f64e8228f001232ff29585ad475e20211ead04f1f700cc',
    });
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/transactions" + "/count" + "?" + params)
      .expect(200);
  });

  it("/tokens/:identifiers/roles- should return 200 status code and roles for a specific token", async () => {
    const identifier: string = "WEGLD-bd4d79";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/roles")
      .expect(200);
  });

  it("/tokens/:identifiers/roles- should return 400 status code Error: Not Found if token is not found", async () => {
    const identifier: string = "WEGLD-bd4d79Test";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/roles")
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Token not found");
      });
  });

  it("/tokens/:identifiers/roles{address} - should return 200 status code and roles for a specific token and address", async () => {
    const identifier: string = "WEGLD-bd4d79";
    const address: string = "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/roles/" + address)
      .expect(200);
  });

  it("/tokens/:identifiers/roles{address} - should return 400 status code Error: Not Found if token is not found", async () => {
    const identifier: string = "WEGLD-bd4d79T";
    const address: string = "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/roles/" + address)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Token not found");
      });
  });
});
