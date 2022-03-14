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

  it("/accounts/{address}} - should return 200 status code and return address details fora specific address", async () => {
    const address: string = "erd1vup7q384decm8l8mu4ehz75c5mfs089nd32fteru95tm8d0a8dqs8g0yst";
    await request(app.getHttpServer())
      .get(route + "/" + address)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}} - should return 400 status code of a specific invalid address account", async () => {
    const address: string = "erd1sea63y47u569ns315mqjf4vnygn9whkk7p6ry4rfpqyd6rd5addqyd9lf2";
    await request(app.getHttpServer())
      .get(route + "/" + address)
      .set("header", "content-type")
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a bech32 address is expected)");
      });
  });

  it("/accounts/{address}/tokens - should return 200 status code and return a list of tokens for a specifc address", async () => {
    const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/tokens - should return 200 status code and return a list of tokens for a specifc smart contract address", async () => {
    const address: string = "erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/tokens - should return 400 status code and return an empty list", async () => {
    const address: string = "erd1sea63y47u569ns315mqjf4vnygn9whkk7p6ry4rfpqyd6rd5addqyd9lf2";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens")
      .set("header", "content-type")
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a bech32 address is expected)");
      });
  });

  it("/accounts/{address}tokens?from=&size= - should return 200 status code and return two tokens for a specific smart contract address", async () => {
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

  it("accounts/{address}}/tokens?identifier - should return 200 status code and return one specific token for a smart contract address based on identifier filter", async () => {
    const params = new URLSearchParams({
      'identifier': 'WEGLD-bd4d79',
    });

    const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });
  it("accounts/{address}}/tokens?identifier - should return 200 status code and return one specific token for a smart contract address based on identifier filter", async () => {
    const params = new URLSearchParams({
      'identifier': 'WEGLD-bd4d79',
    });

    const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("accounts/{address}}/tokens?from=&size&identifier - should return 200 status code and return one specific token for a smart contract address based on identifier filter", async () => {
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

  it("accounts/{address}}/tokens?from=&size&identifiers - should return 200 status code return two specific tokens for a smart contract address based on identifiers filter", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
      'identifiers': 'WEGLD-bd4d79, WATER-9ed400',
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

  it("accounts/{address}}/tokens?from=&size&identifiers - should return 200 status code and two tokens details", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
      'identifiers': 'WEGLD-bd4d79, WATER-9ed400',
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

  it("/accounts/:address/tokens/count - should return 200 status code and address tokens count", async () => {
    const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens/count")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/tokens/count - should return 400 status code for invalid account address", async () => {
    const address: string = "erd1sea63y47u569ns315mqjf4vnygn9whkk7p6ry4rfpqyd6rd5addqyd9lf2";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens/count")
      .set("header", "content-type")
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a bech32 address is expected)");
      });
  });

  it("/accounts/:address/tokens/{collection} - should return 200 status code and collection details for a specific address", async () => {
    const address: string = "erd1qqqqqqqqqqqqqpgqaz6dvegfmlm2ftatg3qx550e2zq07k4ryl5sh0qx2e";
    const collection: string = "OVERTURE-276027";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/collections" + "/" + collection)
      .set("header", "content-type")
      .expect(200);
  });

  it(`/accounts/:address/tokens/{collection} - should return 404 status code and response body with message "Collection for given account not found" `, async () => {
    const address: string = "erd1qqqqqqqqqqqqqpgq09vq93grfqy7x5fhgmh44ncqfp3xaw57ys5s7j9fed";
    const collection: string = "OGS-3f1408";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/collections" + "/" + collection)
      .set("header", "content-type")
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Collection for given account not found");
      });
  });

  //TBD
  it("/accounts/:address/tokens/{tokens} - should return 200 status code and token details for a specific address", async () => {
    const address: string = "erd12xspx5z0nm08tvtt8v3nyu3w8mxfr36rj27u99yesmr7uxj6h7cscsvsw5";
    const token: string = "RIDE-7d18e9";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens" + "/" + token)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts - should return 200 status code and nfts details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts?from=&size - should return 200 status code and 2 nfts details for a specific address, filtered by from&size params", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts?search - should return 200 status code and 2 nfts details for a specific address, filtered by search param", async () => {
    const params = new URLSearchParams({
      'search': 'CHALK-33daec',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts?identifiers - should return 200 status code and 1 nft details for a specific address, filtered by identifiers param", async () => {
    const params = new URLSearchParams({
      'identifiers': 'CHALK-33daec-02',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts?collection - should return 200 status code and all nfts from a collection for a specific address, filtered by collection param", async () => {
    const params = new URLSearchParams({
      'collection': 'CHALK-33daec',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts?collections - should return 200 status code and all nfts from collections, for a specific address, filtered by collections param", async () => {
    const params = new URLSearchParams({
      'collections': 'CRAZYBEAR-d3c2ea,DEAD-79f8d1',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts?name - should return 200 status code and nft details, for a specific address, filtered by name param", async () => {
    const params = new URLSearchParams({
      'name': 'Blue1 Bear',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts?tags - should return 200 status code and nft details, for a specific address, filtered by tags param", async () => {
    const params = new URLSearchParams({
      'tags': 'Undead,Elrond,Treasure Hunt',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts?creator - should return 200 status code and nfts details, for a specific address, filtered by creator param", async () => {
    const params = new URLSearchParams({
      'creator': 'erd1qqqqqqqqqqqqqpgq55mwyqu4xs20lyhq5t7mnwwqmxrl4su5ys5sc5h7mm',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts?hasUris&includeFlagged&withSupply - should return 200 status code and nfts details, for a specific address, filtered by hasUris, includedFlagged and withSupply param", async () => {
    const params = new URLSearchParams({
      'hasUris': 'true',
      'includeFlagged': 'true',
      'withSupply': 'true',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts?source - should return 200 status code and nfts details, for a specific address, filtered by source = ELASTIC param", async () => {
    const params = new URLSearchParams({
      'source': 'elastic',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts?source - should return 200 status code and nfts details, for a specific address, filtered by source = GATEWAY param", async () => {
    const params = new URLSearchParams({
      'source': 'gateway',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts/count - should return 200 status code and nfts count for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts/count")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts/{nft} - should return 200 status code and nft details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    const identifier: string = "CHALK-33daec-02";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "/" + identifier)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/nfts/{nft} - should return 404 status code if nft identifier is not found in wallet address ", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    const identifier: string = "PLANET-2a97b1-01";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "/" + identifier)
      .set("header", "content-type")
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Token for given account not found");
      });
  });

  it("/accounts/{address}/stake - should return 200 status code and staked details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/stake")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/delegation-legacy - should return 200 status code and delegation details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/delegation-legacy")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/keys - should return 200 status code and nodes details for a specific validator address", async () => {
    const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/keys")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/{address}/waiting-list - should return 200 status code and waiting-list details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/waiting-list")
      .set("header", "content-type")
      .expect(200);
  });
});
