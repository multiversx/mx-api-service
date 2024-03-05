import { INestApplication } from "@nestjs/common";
import { mockRoundService } from "./services.mock/rounds.services.mock";
import { RoundController } from "src/endpoints/rounds/round.controller";
import { RoundService } from "src/endpoints/rounds/round.service";
import { PublicAppModule } from "src/public.app.module";
import { Test } from "@nestjs/testing";
import request = require('supertest');

describe('RoundController', () => {
  let app: INestApplication;
  const path: string = "/rounds";
  const roundServiceMocks = mockRoundService();

  beforeAll(async () => {
    jest.resetAllMocks();
    const moduleFixture = await Test.createTestingModule({
      controllers: [RoundController],
      imports: [PublicAppModule],
    })
      .overrideProvider(RoundService)
      .useValue(roundServiceMocks)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('GET /rounds', () => {
    it('should return a list of rounds', async () => {
      roundServiceMocks.getRounds.mockReturnValue([]);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200);

      expect(roundServiceMocks.getRounds).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 0,
          size: 25,
          condition: undefined,
          validator: undefined,
          shard: undefined,
          epoch: undefined,
        })
      );
    });

    it('should return a list of rounds with filters and pagination', async () => {
      const shard = 1;
      const epoch = 10;

      await request(app.getHttpServer())
        .get(`${path}?from=10&size=5&shard=${shard}&epoch=${epoch}`)
        .expect(200);

      expect(roundServiceMocks.getRounds).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 10,
          size: 5,
          validator: undefined,
          shard,
          epoch,
          condition: undefined,
        })
      );
    });
  });

  describe('GET /rounds/count', () => {
    it('should return the count of rounds', async () => {
      roundServiceMocks.getRoundCount.mockReturnValue(Promise.resolve(100));

      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .then((response) => {
          expect(+response.text).toEqual(100);
        });

      expect(roundServiceMocks.getRoundCount).toHaveBeenCalledWith(
        expect.objectContaining({
          validator: undefined,
          shard: undefined,
          epoch: undefined,
          condition: undefined,
        })
      );
    });

    it('should return the count of rounds with filters applied', async () => {
      roundServiceMocks.getRoundCount.mockReturnValue(Promise.resolve(50));
      const shard = 1;
      const epoch = 10;

      await request(app.getHttpServer())
        .get(`${path}/count?shard=${shard}&epoch=${epoch}`)
        .expect(200)
        .then((response) => {
          expect(+response.text).toEqual(50);
        });

      expect(roundServiceMocks.getRoundCount).toHaveBeenCalledWith(
        expect.objectContaining({
          validator: undefined,
          shard: shard,
          epoch: epoch,
          condition: undefined,
        })
      );
    });
  });

  describe('GET /rounds/c', () => {
    it('should return the count of rounds', async () => {
      roundServiceMocks.getRoundCount.mockReturnValue(Promise.resolve(100));

      await request(app.getHttpServer())
        .get(`${path}/c`)
        .expect(200)
        .then((response) => {
          expect(+response.text).toEqual(100);
        });

      expect(roundServiceMocks.getRoundCount).toHaveBeenCalledWith(
        expect.objectContaining({
          validator: undefined,
          shard: undefined,
          epoch: undefined,
          condition: undefined,
        })
      );
    });

    it('should return the count of rounds with filters applied', async () => {
      roundServiceMocks.getRoundCount.mockReturnValue(Promise.resolve(50));
      const shard = 1;
      const epoch = 10;

      await request(app.getHttpServer())
        .get(`${path}/c?shard=${shard}&epoch=${epoch}`)
        .expect(200)
        .then((response) => {
          expect(+response.text).toEqual(50);
        });

      expect(roundServiceMocks.getRoundCount).toHaveBeenCalledWith(
        expect.objectContaining({
          validator: undefined,
          shard: shard,
          epoch: epoch,
          condition: undefined,
        })
      );
    });
  });

  describe('GET /rounds/:shard/:round', () => {
    it('should return round details based on shard and round', async () => {
      roundServiceMocks.getRound.mockReturnValue(Promise.resolve({}));
      const shard = 1;
      const round = 100;

      await request(app.getHttpServer())
        .get(`${path}/${shard}/${round}`)
        .expect(200);

      expect(roundServiceMocks.getRound).toHaveBeenCalledWith(shard, round);
    });

    it('should return 404 for a non-existent round', async () => {
      roundServiceMocks.getRound.mockRejectedValue(new Error('Round not found'));
      const shard = 1;
      const round = 10_000_000;

      await request(app.getHttpServer())
        .get(`${path}/${shard}/${round}`)
        .expect(404);
    });
  });
});
