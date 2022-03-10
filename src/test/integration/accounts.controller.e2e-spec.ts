import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Accounts Controller", () => {
  let app: INestApplication;

  const route: string = "/accounts";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("/accounts - should return 200 for request of 100 accounts", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '100',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200)
      .then(res => {
        expect(res.body).toHaveLength(100);
      });
  });

  it("/accounts/count - should return 200 for request of accounts count", async () => {
    await request(app.getHttpServer())
      .get(route + "/count")
      .expect(200);
  });

  it("/accounts/{address}} - should return 200 for request of a specific address account", async () => {
    const address: string = "erd1vup7q384decm8l8mu4ehz75c5mfs089nd32fteru95tm8d0a8dqs8g0yst";
    await request(app.getHttpServer())
      .get(route + "/" + address)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}} - should return 400 for request of a specific invalid address account", async () => {
    const address: string = "erd1sea63y47u569ns315mqjf4vnygn9whkk7p6ry4rfpqyd6rd5addqyd9lf2";
    await request(app.getHttpServer())
      .get(route + "/" + address)
      .set("header", "content-type")
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a bech32 address is expected)");
      });
  });

  it("/accounts/{address}/tokens - should return 200 for request to return a list of tokens for a specifc address", async () => {
    const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/tokens - should return 200 for request to return a list of tokens for a specifc smart contract address", async () => {
    const address: string = "erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/tokens - should return 400 for request to return a list of tokens for a specifc invalid address", async () => {
    const address: string = "erd1sea63y47u569ns315mqjf4vnygn9whkk7p6ry4rfpqyd6rd5addqyd9lf2";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens")
      .set("header", "content-type")
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a bech32 address is expected)");
      });
  });

  it("/accounts/{address}tokens?from=0&size=2 - should return 200 for request to return two tokens for a specific smart contract address", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
    });

    const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens" + "?" + params)
      .set("header", "content-type")
      .expect(200)
      .then(res => {
        expect(res.body).toHaveLength(2);
      });
  });

  it("accounts/{address}}/tokens?identifier - should return 200 for request to return one specific token for a smart contract address based on identifier filter", async () => {
    const params = new URLSearchParams({
      'identifier': 'WEGLD-bd4d79',
    });

    const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });
  it("accounts/{address}}/tokens?identifier - should return 200 for request to return one specific token for a smart contract address based on identifier filter", async () => {
    const params = new URLSearchParams({
      'identifier': 'WEGLD-bd4d79',
    });

    const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("accounts/{address}}/tokens?from=&size&identifier - should return 200 for request to return one specific token for a smart contract address based on identifier filter", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '1',
      'identifier': 'WEGLD-bd4d79',
    });

    const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens" + "?" + params)
      .set("header", "content-type")
      .expect(200)
      .then(res => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].identifier).toStrictEqual("WEGLD-bd4d79");
      });
  });
});
