import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Nodes Controller", () => {
  let app: INestApplication;
  const route: string = "/nodes";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("/nodes - should return 200 status code and one list of nodes", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/nodes?from&size - should return 200 status code and one list of 50 nodes", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&order - should return 200 status code and one list of 50 nodes order ascending", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'order': "asc",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&order - should return 200 status code and one list of 50 nodes order descending", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'order': "desc",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&sort - should return 200 status code and one list of 50 nodes sorted by name", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'sort': "name",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&sort - should return 200 status code and one list of 50 nodes sorted by version", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'sort': "version",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&sort - should return 200 status code and one list of 50 nodes sorted by tempRating", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'sort': "tempRating",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&sort - should return 200 status code and one list of 50 nodes sorted by leaderSuccess", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'sort': "leaderSuccess",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&sort - should return 200 status code and one list of 50 nodes sorted by leaderFailure", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'sort': "leaderFailure",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&sort - should return 200 status code and one list of 50 nodes sorted by validatorSuccess", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'sort': "validatorSuccess",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&sort - should return 200 status code and one list of 50 nodes sorted by validatorFailure", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'sort': "validatorFailure",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&sort - should return 200 status code and one list of 50 nodes sorted by validatorIgnoredSignatures", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'sort': "validatorIgnoredSignatures",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&sort - should return 200 status code and one list of 50 nodes sorted by position", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'sort': "position",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&sort - should return 400 status code Error: Bad Request", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
      'sort': "TEST",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (one of the following values is expected: name, version, tempRating, leaderSuccess, leaderFailure, validatorSuccess, validatorFailure, validatorIgnoredSignatures, position, auctionPosition)");
      });
  });

  it("/nodes?owner - should return 200 status code and one list of nodes filtered by owner", async () => {
    const params = new URLSearchParams({
      'owner': "erd1kz2kumr0clug4ht2ek0l4l9drvq3rne9lmkwrjf3qv2luyuuaj2szjwv0f",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?provider - should return 200 status code and one list of nodes filtered by provider", async () => {
    const params = new URLSearchParams({
      'provider': "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?provider - should return 400 status code if provider address is not in correct format(bech32)", async () => {
    const params = new URLSearchParams({
      'provider': "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5s",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a bech32 address is expected)");
      });
  });

  it("/nodes?issues - should return 200 status code and one list of nodes with issues = true", async () => {
    const params = new URLSearchParams({
      'issues': "true",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?issues - should return 200 status code and one list of nodes with issues = false", async () => {
    const params = new URLSearchParams({
      'issues': "false",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?shard - should return 200 status code and one list of nodes filtered by shard", async () => {
    const params = new URLSearchParams({
      'shard': "1",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?status - should return 200 status code and one list of nodes with status new", async () => {
    const params = new URLSearchParams({
      'status': "new",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?status - should return 200 status code and one list of nodes with status unknown", async () => {
    const params = new URLSearchParams({
      'status': "unknown",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?status - should return 200 status code and one list of nodes with status waiting", async () => {
    const params = new URLSearchParams({
      'status': "waiting",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?status - should return 200 status code and one list of nodes with status eligible", async () => {
    const params = new URLSearchParams({
      'status': "eligible",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?status - should return 200 status code and one list of nodes with status jailed", async () => {
    const params = new URLSearchParams({
      'status': "jailed",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?status - should return 200 status code and one list of nodes with status queued", async () => {
    const params = new URLSearchParams({
      'status': "queued",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?status - should return 200 status code and one list of nodes with status leaving", async () => {
    const params = new URLSearchParams({
      'status': "leaving",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?type - should return 200 status code and one list of nodes with type validator", async () => {
    const params = new URLSearchParams({
      'type': "validator",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&type - should return 200 status code and one list of 20 nodes with type validator", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '20',
      'type': "validator",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });


  it("/nodes?type - should return 200 status code and one list of nodes with type observer", async () => {
    const params = new URLSearchParams({
      'type': "observer",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&type - should return 200 status code and one list of 20 nodes with type observer", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '20',
      'type': "observer",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?online - should return 200 status code and one list of nodes with status online true", async () => {
    const params = new URLSearchParams({
      'online': "true",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&online - should return 200 status code and one list of 20 nodes with status online true", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '20',
      'online': "true",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?online - should return 200 status code and one list of nodes with status online false", async () => {
    const params = new URLSearchParams({
      'online': "false",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes?from&size&online - should return 200 status code and one list of 20 nodes with status online false", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '20',
      'online': "false",
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nodes/versions - should return 200 status code and nodes versions", async () => {
    await request(app.getHttpServer())
      .get(route + "/versions")
      .expect(200);
  });

  it("/nodes/count - should return 200 status code and nodes total count", async () => {
    await request(app.getHttpServer())
      .get(route + "/count")
      .expect(200);
  });

  it("/nodes/count?order - should return 200 status code and nodes total count ordered ascending", async () => {
    const params = new URLSearchParams({
      'order': "asc",
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?order - should return 200 status code and nodes total count ordered descending", async () => {
    const params = new URLSearchParams({
      'order': "desc",
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?sorted - should return 200 status code and total count nodes sorted by name", async () => {
    const params = new URLSearchParams({
      'sort': "name",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?sorted - should return 200 status code and total count nodes sorted by version", async () => {
    const params = new URLSearchParams({
      'sort': "version",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?sorted - should return 200 status code and total count nodes by tempRating", async () => {
    const params = new URLSearchParams({
      'sort': "tempRating",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?sorted - should return 200 status code and total count nodes by leaderSuccess", async () => {
    const params = new URLSearchParams({
      'sort': "leaderSuccess",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?sorted - should return 200 status code and total count nodes by leaderFailure", async () => {
    const params = new URLSearchParams({
      'sort': "leaderFailure",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?sorted - should return 200 status code and total count nodes by validatorSuccess", async () => {
    const params = new URLSearchParams({
      'sort': "validatorSuccess",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?sorted - should return 200 status code and total count nodes by validatorFailure", async () => {
    const params = new URLSearchParams({
      'sort': "validatorFailure",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?sorted - should return 200 status code and total count nodes by validatorIgnoredSignatures", async () => {
    const params = new URLSearchParams({
      'sort': "validatorIgnoredSignatures",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?sorted - should return 200 status code and total count nodes sorted by position", async () => {
    const params = new URLSearchParams({
      'sort': "position",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?owner - should return 200 status code and total nodes count filtered by owner", async () => {
    const params = new URLSearchParams({
      'owner': "erd1kz2kumr0clug4ht2ek0l4l9drvq3rne9lmkwrjf3qv2luyuuaj2szjwv0f",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?provider - should return 200 status code and total nodes count filtered by provider", async () => {
    const params = new URLSearchParams({
      'provider': "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?provider - should return 400 status code if provider address is not in correct format(bech32)", async () => {
    const params = new URLSearchParams({
      'provider': "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5s",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a bech32 address is expected)");
      });
  });

  it("/nodes/count?issues - should return 200 status code and total count nodes with issues = true", async () => {
    const params = new URLSearchParams({
      'issues': "true",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?issues - should return 200 status code and total count nodes with issues = false", async () => {
    const params = new URLSearchParams({
      'issues': "false",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?shard - should return 200 status code and total count nodes with shard = 1", async () => {
    const params = new URLSearchParams({
      'shard': "1",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?status - should return 200 status code and total count nodes with status = new", async () => {
    const params = new URLSearchParams({
      'status': "new",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?status - should return 200 status code and total count nodes with status = unknown", async () => {
    const params = new URLSearchParams({
      'status': "unknown",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?status - should return 200 status code and total count nodes with status = waiting", async () => {
    const params = new URLSearchParams({
      'status': "waiting",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?status - should return 200 status code and total count nodes with status = eligible", async () => {
    const params = new URLSearchParams({
      'status': "eligible",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?status - should return 200 status code and total count nodes with status = jailed", async () => {
    const params = new URLSearchParams({
      'status': "jailed",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?status - should return 200 status code and total count nodes with status = queued", async () => {
    const params = new URLSearchParams({
      'status': "queued",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?status - should return 200 status code and total count nodes with status = leaving", async () => {
    const params = new URLSearchParams({
      'status': "leaving",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?type - should return 200 status code and total count nodes with type = observer", async () => {
    const params = new URLSearchParams({
      'type': "observer",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?type - should return 200 status code and total count nodes with type = validator", async () => {
    const params = new URLSearchParams({
      'type': "validator",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?online - should return 200 status code and total count nodes with online = true", async () => {
    const params = new URLSearchParams({
      'online': "true",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/count?online - should return 200 status code and total count nodes with online = false", async () => {
    const params = new URLSearchParams({
      'online': "false",
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nodes/:bls - should return 200 status code and node details based on bls identifier", async () => {
    const identifier: string = "00f9b676245ecf7bc74e3b644c106cfbbb366ce01a0149c1e50303d22c09bef7600f21f1925753ab994174b9926e9b078c2d1edaf03c221149ea0239722278aa864a1b26f298c29fe546fdb0ee1385243dfe407074e0dfa134c7e6d4197ce110";
    await request(app.getHttpServer())
      .get(route + "/" + identifier)
      .expect(200);
  });

  it("/nodes/:bls - should return 404 status code Erro: Node not found", async () => {
    const identifier: string = "00f9b676245ecf7bc74e3b644c106cfbbb366ce01a0149c1e50303d22c09bef7600f21f1925753ab994174b9926e9b078c2d1edaf03c221149ea0239722278aa864a1b26f298c29fe546fdb0ee1385243dfe407074e0dfa134c7e6d4197ce110T";
    await request(app.getHttpServer())
      .get(route + "/" + identifier)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Node not found");
      });
  });
});
