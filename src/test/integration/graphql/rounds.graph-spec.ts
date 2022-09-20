import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Rounds', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Rounds', () => {
    it('should returns a list of 10 rounds available on blockchain', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            rounds(input:{
              size: 10
            }){
              blockWasProposed
              round
              epoch
              timestamp
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.rounds).toBeDefined();
          expect(res.body.data.rounds).toHaveLength(10);

          for (const item of res.body.data.rounds) {
            expect(item.blockWasProposed).toBeDefined();
            expect(item.round).toBeDefined();
            expect(item.epoch).toBeDefined();
            expect(item.timestamp).toBeDefined();
          }
        });
    });
  });

  describe('Query - Get Rounds with filters applied', () => {
    [
      {
        filter: 'validator',
        value: '"014f8602f899c42bb485edff240e1b4ad90a0d9cb029331619ca7b4378e18dc423899adfbf318001e11d5a1c865dd11556bb2172d8912f5a9f86bfad45d503d7c9fa3d082f919181e4c15f8231137c8393186998ee3143b8b5d43e444a8fca07"',
      },
      {
        filter: 'shard',
        value: 1,
      },
      {
        filter: 'epoch',
        value: 594,
      },

    ].forEach(({ filter, value }) => {
      describe(`with filter = ${filter}`, () => {
        it(`should return rounds details based on ${filter} filter with value ${value}`, async () => {
          await request(app.getHttpServer())
            .post(gql)
            .send({
              query: `{
                rounds(input:{
                  ${filter}: ${value}
                }){
                  blockWasProposed
                  round
                  epoch
                  timestamp
                }
              }`,
            })
            .then(res => {
              expect(res.body.data.rounds).toBeDefined();
              for (const item of res.body.data.rounds) {
                expect(item.blockWasProposed).toBeDefined();
                expect(item.round).toBeDefined();
                expect(item.epoch).toBeDefined();
                expect(item.timestamp).toBeDefined();
              }
            });
        });
      });
    });
  });

  describe('Query - Get Rounds count with filters applied', () => {
    [
      {
        filter: 'validator',
        value: '"014f8602f899c42bb485edff240e1b4ad90a0d9cb029331619ca7b4378e18dc423899adfbf318001e11d5a1c865dd11556bb2172d8912f5a9f86bfad45d503d7c9fa3d082f919181e4c15f8231137c8393186998ee3143b8b5d43e444a8fca07"',
        count: 1039340,
      },
      {
        filter: 'shard',
        value: 1,
        count: 999843,
      },
      {
        filter: 'epoch',
        value: 594,
        count: 9604,
      },

    ].forEach(({ filter, value, count }) => {
      describe(`with filter = ${filter}`, () => {
        it(`should return rounds count based on ${filter} filter with value ${value}`, async () => {
          await request(app.getHttpServer())
            .post(gql)
            .send({
              query: `{
                roundsCount(input:{
                  ${filter}: ${value}
                })
              }`,
            })
            .then(res => {
              expect(res.body.data.roundsCount).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });

  describe('Query - Get Round', () => {
    it('should returns round details from a specific shard and round', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            round(input:{
              shard: 2, round: 781
            }){
              blockWasProposed
              round
              shard
              epoch
              timestamp
              signers
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.round.blockWasProposed).toBeDefined();
          expect(res.body.data.round.round).toStrictEqual(781);
          expect(res.body.data.round.shard).toStrictEqual(2);
          expect(res.body.data.round.epoch).toBeDefined();
          expect(res.body.data.round.timestamp).toBeDefined();
          expect(res.body.data.round.signers).toBeDefined();
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
