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

  it("/accounts/:address - should return 200 status code and return address details fora specific address", async () => {
    const address: string = "erd1vup7q384decm8l8mu4ehz75c5mfs089nd32fteru95tm8d0a8dqs8g0yst";
    await request(app.getHttpServer())
      .get(route + "/" + address)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address - should return 400 status code of a specific invalid address account", async () => {
    const address: string = "erd1sea63y47u569ns315mqjf4vnygn9whkk7p6ry4rfpqyd6rd5addqyd9lf2";
    await request(app.getHttpServer())
      .get(route + "/" + address)
      .set("header", "content-type")
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a bech32 address is expected)");
      });
  });

  it("/accounts/:address/tokens - should return 200 status code and return a list of tokens for a specifc address", async () => {
    const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/tokens - should return 200 status code and return a list of tokens for a specifc smart contract address", async () => {
    const address: string = "erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/tokens - should return 400 status code and return an empty list", async () => {
    const address: string = "erd1sea63y47u569ns315mqjf4vnygn9whkk7p6ry4rfpqyd6rd5addqyd9lf2";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens")
      .set("header", "content-type")
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a bech32 address is expected)");
      });
  });

  it("/accounts/:address/tokens?from=&size= - should return 200 status code and return two tokens for a specific smart contract address", async () => {
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

  it("accounts/:address/tokens?identifier - should return 200 status code and return one specific token for a smart contract address based on identifier filter", async () => {
    const params = new URLSearchParams({
      'identifier': 'WEGLD-bd4d79',
    });

    const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });
  it("accounts/:address/tokens?identifier - should return 200 status code and return one specific token for a smart contract address based on identifier filter", async () => {
    const params = new URLSearchParams({
      'identifier': 'WEGLD-bd4d79',
    });

    const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("accounts/:address/tokens?from=&size&identifier - should return 200 status code and return one specific token for a smart contract address based on identifier filter", async () => {
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

  it("accounts/:address/tokens?from=&size&identifiers - should return 200 status code return two specific tokens for a smart contract address based on identifiers filter", async () => {
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

  it("accounts/:address/tokens?from=&size&identifiers - should return 200 status code and two tokens details", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
      'identifiers': 'WEGLD-bd4d79,WATER-9ed400',
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

  it("/accounts/:address/tokens/:collection - should return 200 status code and collection details for a specific address", async () => {
    const address: string = "erd1qqqqqqqqqqqqqpgqaz6dvegfmlm2ftatg3qx550e2zq07k4ryl5sh0qx2e";
    const collection: string = "OVERTURE-276027";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/collections" + "/" + collection)
      .set("header", "content-type")
      .expect(200);
  });

  it(`/accounts/:address/tokens/:collection - should return 404 status code and response body with message "Collection for given account not found" `, async () => {
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

  it("/accounts/:address/tokens/:tokens - should return 200 status code and token details for a specific address", async () => {
    const address: string = "erd12xspx5z0nm08tvtt8v3nyu3w8mxfr36rj27u99yesmr7uxj6h7cscsvsw5";
    const token: string = "WEGLD-bd4d79";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens" + "/" + token)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/tokens/:tokens - should return 404 status code with no token found", async () => {
    const address: string = "erd12xspx5z0nm08tvtt8v3nyu3w8mxfr36rj27u99yesmr7uxj6h7cscsvsw5";
    const token: string = "MAND-1f4b00";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/tokens" + "/" + token)
      .set("header", "content-type")
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Token for given account not found");
      });
  });

  it("/accounts/:address/nfts - should return 200 status code and nfts details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts?from=&size - should return 200 status code and 2 nfts details for a specific address, filtered by from&size params", async () => {
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

  it("/accounts/:address/nfts?search - should return 200 status code and 2 nfts details for a specific address, filtered by search param", async () => {
    const params = new URLSearchParams({
      'search': 'CHALK-33daec',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts?identifiers - should return 200 status code and 1 nft details for a specific address, filtered by identifiers param", async () => {
    const params = new URLSearchParams({
      'identifiers': 'CHALK-33daec-02',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts?collection - should return 200 status code and all nfts from a collection for a specific address, filtered by collection param", async () => {
    const params = new URLSearchParams({
      'collection': 'CHALK-33daec',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts?collections - should return 200 status code and all nfts from collections, for a specific address, filtered by collections param", async () => {
    const params = new URLSearchParams({
      'collections': 'CRAZYBEAR-d3c2ea,DEAD-79f8d1',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts?name - should return 200 status code and nft details, for a specific address, filtered by name param", async () => {
    const params = new URLSearchParams({
      'name': 'Blue1 Bear',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts?tags - should return 200 status code and nft details, for a specific address, filtered by tags param", async () => {
    const params = new URLSearchParams({
      'tags': 'Undead,Elrond,Treasure Hunt',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts?creator - should return 200 status code and nfts details, for a specific address, filtered by creator param", async () => {
    const params = new URLSearchParams({
      'creator': 'erd1qqqqqqqqqqqqqpgq55mwyqu4xs20lyhq5t7mnwwqmxrl4su5ys5sc5h7mm',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts?hasUris&includeFlagged&withSupply - should return 200 status code and nfts details, for a specific address, filtered by hasUris, includedFlagged and withSupply param", async () => {
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

  it("/accounts/:address/nfts?source - should return 200 status code and nfts details, for a specific address, filtered by source = ELASTIC param", async () => {
    const params = new URLSearchParams({
      'source': 'elastic',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts?source - should return 200 status code and nfts details, for a specific address, filtered by source = GATEWAY param", async () => {
    const params = new URLSearchParams({
      'source': 'gateway',
    });

    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts/count - should return 200 status code and nfts count for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts/count")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts/:nft - should return 200 status code and nft details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    const identifier: string = "CHALK-33daec-02";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/nfts" + "/" + identifier)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/nfts/:nft - should return 404 status code if nft identifier is not found in wallet address ", async () => {
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

  it("/accounts/:address/stake - should return 200 status code and staked details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/stake")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/delegation-legacy - should return 200 status code and delegation details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/delegation-legacy")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/keys - should return 200 status code and nodes details for a specific validator address", async () => {
    const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/keys")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/waiting-list - should return 200 status code and waiting-list details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/waiting-list")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?withLogs=true - should return 200 status code and all transactions details for a specific address", async () => {
    const params = new URLSearchParams({
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?withLogs=false - should return 200 status code and all transactions details for a specific address", async () => {
    const params = new URLSearchParams({
      'withLogs': 'false',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?withLogs=true - should return 200 status code and two transactions details for a specific address", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?withLogs=true - should return 200 status code and two transactions details for a specific address", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?sender&withLogs=true - should return 200 status code and transactions details based on sender for a specific address", async () => {
    const params = new URLSearchParams({
      'sender': 'erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?hashes&withLogs=true - should return 200 status code and transactions details based on hashes for a specific address", async () => {
    const params = new URLSearchParams({
      'hashes': '9a44108f6c8987a49b17923fa2529f3e30e191ff27c761e661b6a48ae0fab92e',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?status&withLogs=true - should return 200 status code and transactions details based on token identifier for a specific address", async () => {
    const params = new URLSearchParams({
      'token': 'TFMAPUNKS-2ed0df-0552',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?senderShard&withLogs=true - should return 200 status code and transactions details based on sender shard for a specific address", async () => {
    const params = new URLSearchParams({
      'senderShard': '1',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?receiverShard&withLogs=true - should return 200 status code and transactions details based on receiver Shard for a specific address", async () => {
    const params = new URLSearchParams({
      'receiverShard': '2',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?miniBlock&withLogs=true - should return 200 status code and transactions details based on miniBlock for a specific address", async () => {
    const params = new URLSearchParams({
      'miniBlock': '8b23b83735c9d10589f4b73684abccbbedd86b26bf0904824c76c557399872b3',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?order&withLogs=true - should return 200 status code and transactions details based on order = asc for a specific address", async () => {
    const params = new URLSearchParams({
      'order': 'asc',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?order&withLogs=true - should return 200 status code and transactions details based on order = desc for a specific address", async () => {
    const params = new URLSearchParams({
      'order': 'desc',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?withScResults&withLogs=true - should return 200 status code and transactions details based on withScResults for a specific address", async () => {
    const params = new URLSearchParams({
      'withScResults': 'true',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?withScResults&withLogs=true - should return 200 status code and transactions details based on withScResults for a specific address", async () => {
    const params = new URLSearchParams({
      'withScResults': 'false',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?withOperations&withLogs=true - should return 200 status code and transactions details based on withOperations for a specific address", async () => {
    const params = new URLSearchParams({
      'withOperations': 'true',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?withOperations&withLogs=true - should return 200 status code and transactions details based on withOperations for a specific address", async () => {
    const params = new URLSearchParams({
      'withOperations': 'false',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions?withScResults&withOperations&withLogs=true - should return 200 status code and transactions details based on withOperations and withScResults for a specific address", async () => {
    const params = new URLSearchParams({
      'withScResults': 'true',
      'withOperations': 'true',
      'withLogs': 'true',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/transactions/count - should return 200 status code and transactions count for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions/count")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address:/transactions/count?sender - should return 200 status code and transactions count based on sender filter for a specific address", async () => {
    const params = new URLSearchParams({
      'sender': 'erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/transactions/count" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address:/contracts - should return 200 status code and contracts details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/contracts")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address:/contracts?from&size - should return 200 status code and two contracts details for a specific address", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/contracts" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address:/contracts/count - should return 200 status code and contracts count for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/contracts/count")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/sc-results - should return 200 status code and sc-results details for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/sc-results")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/sc-results - should return 400 status code with Error: Bad Request ", async () => {
    const address: string = "erd1dgctxljv7f6x8ngssqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/sc-results")
      .set("header", "content-type")
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a bech32 address is expected)");
      });
  });

  it("/accounts/:address/sc-results?from&size - should return 200 status code and two sc-results details for a specific address", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/sc-results" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/sc-results/count - should return 200 status code and sc-results count for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/sc-results/count")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/sc-results/{scHash} - should return 200 status code and sc-results details based on hash for a specific address", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    const hash: string = "f7377cc5cb24136ec806d3b8053d4ab9ef5a1b59aad70f909ee78ea38d65eb7e";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/sc-results/" + hash)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/sc-results/{scHash} - should return 400 status code Error: Bad Request with invalid schash ", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    const hash: string = "f7377cc5cb24136ec806d3b8053d4sab9ef5a1b59aad70f909ee78ea38d65eb7e";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/sc-results/" + hash)
      .set("header", "content-type")
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a valid hash with size 64 for transaction is expected)");
      });
  });

  it("/accounts/:address/history - should return 200 status code and address history details ", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/history")
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/history - should return 200 status code and two address history details ", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/history" + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/history/:tokenIdentifier - should return 200 status code and token history details for a specific address and token ", async () => {
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    const identifier: string = "RIDE-7d18e9";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/history/" + identifier)
      .set("header", "content-type")
      .expect(200);
  });

  it("/accounts/:address/history/?tokenIdentifier&from&size - should return 200 status code and two token history details for a specific address and token ", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
    });
    const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
    const identifier: string = "RIDE-7d18e9";

    await request(app.getHttpServer())
      .get(route + "/" + address + "/history/" + identifier + "?" + params)
      .set("header", "content-type")
      .expect(200);
  });
});
