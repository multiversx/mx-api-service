import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Block Controller", () => {
  let app: INestApplication;
  const route: string = "/blocks";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("/blocks - should return 200 status code and block details", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/blocks?from&size - should return 200 status code and two block details", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '2',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/blocks?nonce - should return 200 status code and blocks details based on nonce filter", async () => {
    const params = new URLSearchParams({
      'nonce': '8535172',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/blocks?epoch - should return 200 status code and blocks details based on epoch filter", async () => {
    const params = new URLSearchParams({
      'epoch': '592',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/blocks?validator - should return 200 status code and blocks details based on validator filter", async () => {
    const params = new URLSearchParams({
      'validator': '00f9b676245ecf7bc74e3b644c106cfbbb366ce01a0149c1e50303d22c09bef7600f21f1925753ab994174b9926e9b078c2d1edaf03c221149ea0239722278aa864a1b26f298c29fe546fdb0ee1385243dfe407074e0dfa134c7e6d4197ce110',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/blocks?validator - should return 400 status code with Error: Bad Request", async () => {
    const params = new URLSearchParams({
      'validator': '00f9b676245ecf7bc74e3b644c106cfbbbs366ce01a0149c1e50303d22c09bef7600f21f1925753ab994174b9926e9b078c2d1edaf03c221149ea0239722278aa864a1b26f298c29fe546fdb0ee1385243dfe407074e0dfa134c7e6d4197ce110',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a valid hash with size 192 for bls is expected)");
      });
  });

  it("/blocks?proposer - should return 200 status code and blocks details based on proposer filter", async () => {
    const params = new URLSearchParams({
      'proposer': '00f9b676245ecf7bc74e3b644c106cfbbb366ce01a0149c1e50303d22c09bef7600f21f1925753ab994174b9926e9b078c2d1edaf03c221149ea0239722278aa864a1b26f298c29fe546fdb0ee1385243dfe407074e0dfa134c7e6d4197ce110',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/blocks?shard - should return 200 status code and blocks details based on shard filter", async () => {
    const params = new URLSearchParams({
      'shard': '0',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/blocks/count - should return 200 status code and blocks count", async () => {
    await request(app.getHttpServer())
      .get(route + "/count")
      .expect(200);
  });

  it("/blocks/count?nonce - should return 200 status code and blocks count based on nonce filter", async () => {
    const params = new URLSearchParams({
      'nonce': '8534500',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/blocks/count?epoch - should return 200 status code and blocks count based on epoch filter", async () => {
    const params = new URLSearchParams({
      'epoch': '592',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/blocks/count?validator - should return 200 status code and blocks count based on validator filter", async () => {
    const params = new URLSearchParams({
      'validator': '00f9b676245ecf7bc74e3b644c106cfbbb366ce01a0149c1e50303d22c09bef7600f21f1925753ab994174b9926e9b078c2d1edaf03c221149ea0239722278aa864a1b26f298c29fe546fdb0ee1385243dfe407074e0dfa134c7e6d4197ce110',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/blocks/count?proposer - should return 200 status code and blocks count based on proposer filter", async () => {
    const params = new URLSearchParams({
      'proposer': '00f9b676245ecf7bc74e3b644c106cfbbb366ce01a0149c1e50303d22c09bef7600f21f1925753ab994174b9926e9b078c2d1edaf03c221149ea0239722278aa864a1b26f298c29fe546fdb0ee1385243dfe407074e0dfa134c7e6d4197ce110',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/blocks/count?shard - should return 200 status code and blocks count based on shard filter", async () => {
    const params = new URLSearchParams({
      'shard': '0',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/blocks/:hash - should return 200 status code and block details based on hash", async () => {
    const hash: string = "870e0aa4aed8f1007dcbd666aac43e8add03ad07e808030eb6fb45b607971a63";

    await request(app.getHttpServer())
      .get(route + "/" + hash)
      .expect(200);
  });

  it("/blocks/:hash - should return 400 status code Error: Bad Request ", async () => {
    const hash: string = "870e0aa4aed8f1007dcbd666aac43e8add03ads07e808030eb6fb45b607971a63";

    await request(app.getHttpServer())
      .get(route + "/" + hash)
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Validation failed (a valid hash with size 64 for block is expected)");
      });
  });
});
