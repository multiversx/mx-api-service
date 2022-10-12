import { RoundController } from '../../../endpoints/rounds/round.controller';
import { HttpException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe.skip("Rounds Controller", () => {
  let app: INestApplication;
  let roundController: RoundController;

  const route: string = "/rounds";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    roundController = moduleRef.get<RoundController>(RoundController);

    await app.init();
  });

  it("/rounds - should return 200 status code and one list of rounds", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/rounds?from&size - should return 200 status code and one list of 50 rounds", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/rounds?epoch - should return 200 status code and one list of rounds in epoch 594", async () => {
    const params = new URLSearchParams({
      'epoch': '594',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/rounds?epoch - should return 200 status code and one list of 10 rounds in epoch 594", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
      'epoch': '594',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/rounds?shard - should return 200 status code and one list of rounds in shard 1", async () => {
    const params = new URLSearchParams({
      'shard': '1',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/rounds?shard - should return 200 status code and one list of 10 rounds in shard 1", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
      'shard': '1',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/rounds?validator - should return 200 status code and one list of rounds for a specific validator (node)", async () => {
    const params = new URLSearchParams({
      'validator': '014f8602f899c42bb485edff240e1b4ad90a0d9cb029331619ca7b4378e18dc423899adfbf318001e11d5a1c865dd11556bb2172d8912f5a9f86bfad45d503d7c9fa3d082f919181e4c15f8231137c8393186998ee3143b8b5d43e444a8fca07',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/rounds?validator - should return 200 status code and one list of 10 rounds for a specific validator (node)", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
      'validator': '014f8602f899c42bb485edff240e1b4ad90a0d9cb029331619ca7b4378e18dc423899adfbf318001e11d5a1c865dd11556bb2172d8912f5a9f86bfad45d503d7c9fa3d082f919181e4c15f8231137c8393186998ee3143b8b5d43e444a8fca07',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/rounds/count - should return 200 status code and rounds total count", async () => {
    await request(app.getHttpServer())
      .get(route + "/count")
      .expect(200);
  });

  it("/rounds/count?from&size - should return 200 status code and rounds total count with from and size parameters applyed", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/rounds/count?epoch - should return 200 status code and rounds total count from a specific epoch ", async () => {
    const params = new URLSearchParams({
      'epoch': '594',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/rounds/count?shard - should return 200 status code and rounds total count from a specific shard ", async () => {
    const params = new URLSearchParams({
      'shard': '1',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/rounds/count?validator - should return 200 status code and rounds total count from a specific validator (node) ", async () => {
    const params = new URLSearchParams({
      'validator': '014f8602f899c42bb485edff240e1b4ad90a0d9cb029331619ca7b4378e18dc423899adfbf318001e11d5a1c865dd11556bb2172d8912f5a9f86bfad45d503d7c9fa3d082f919181e4c15f8231137c8393186998ee3143b8b5d43e444a8fca07',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/rounds/:shard/:round- should return 200 status code and rounds details from a specific shard and round ", async () => {
    const shard: number = 0;
    const round: number = 8557848;

    await request(app.getHttpServer())
      .get(route + "/" + shard + "/" + round)
      .expect(200);
  });

  it("/rounds/:shard/:round- should return 200 status code and rounds details from a specific shard and round ", async () => {
    const shard: number = 1;
    const round: number = 8557841;

    await request(app.getHttpServer())
      .get(route + "/" + shard + "/" + round)
      .expect(200);
  });

  it("/rounds/:shard/:round- should return 200 status code and rounds details from a specific shard and round ", async () => {
    const shard: number = 2;
    const round: number = 8557848;

    await request(app.getHttpServer())
      .get(route + "/" + shard + "/" + round)
      .expect(200);
  });

  it("should return HttpException ( NOT FOUND ) if round is not found", async () => {
    await expect(roundController.getRound(0, 0)).rejects.toThrow(
      HttpException,
    );
  });
});
