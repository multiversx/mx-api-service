import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MiniBlockDetailed } from 'src/endpoints/miniblocks/entities/mini.block.detailed';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Miniblocks Controller", () => {
  let app: INestApplication;
  const path: string = "/miniblocks";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/miniblocks', () => {
    it('should return 25 distinct miniblocks', async () => {
      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<MiniBlockDetailed>);
          expect(res.body).toHaveLength(25);
        });
    });

    [
      {
        size: 3,
      },
      {
        size: 100,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} distinct miniblocks`, async () => {
          await request(app.getHttpServer())
            .get(`${path}?size=${size}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<MiniBlockDetailed>);
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });

    [
      {
        filter: 'hashes',
        value: '11184c20703542b11e225f48c825812611c9291f2694075f9006b7cdec409987',
      },
      {
        filter: 'hashes',
        value: '11184c20703542b11e225f48c825812611c9291f2694075f9006b7cdec409987,d598d0f6f04949ae572ea1c44e1cf4f981c06abfd6fca2e2a9c0a05b267dfd6a',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return a list of all distinct miniblocks, filtered by miniblocks blocks hashes=${value}`, async () => {
          await request(app.getHttpServer())
            .get(`${path}?${filter}=${value}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeDefined();
              expect(res.body).toBeInstanceOf(Array<MiniBlockDetailed>);
              for (let i = 0; i < res.body.length; i++) {
                expect(res.body[i].miniBlockHash === '11184c20703542b11e225f48c825812611c9291f2694075f9006b7cdec409987' || res.body[i].miniBlockHash === 'd598d0f6f04949ae572ea1c44e1cf4f981c06abfd6fca2e2a9c0a05b267dfd6a').toBe(true);
              }
            });
        });
      });
    });

    [
      {
        filter: 'type',
        value: 'SmartContractResultBlock',
      },
      {
        filter: 'type',
        value: 'TxBlock',
      },
      {
        filter: 'type',
        value: 'InvalidBlock',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        if (value === 'SmartContractResultBlock') {
          it(`should return a list of distinct miniblocks, sorted by type=${value}`, async () => {
            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<MiniBlockDetailed>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type).toStrictEqual('SmartContractResultBlock');
                }
              });
          });
        } else if (value === 'TxBlock') {
          it(`should return a list of distinct miniblocks, sorted by type=${value}`, async () => {
            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<MiniBlockDetailed>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type).toStrictEqual('TxBlock');
                }
              });
          });
        } else if (value === 'InvalidBlock') {
          it(`should return a list of distinct miniblocks, sorted by type=${value}`, async () => {
            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<MiniBlockDetailed>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type).toStrictEqual('InvalidBlock');
                }
              });
          });
        }
      });
    });
  });

  describe('/miniblocks/{miniBlockHash}', () => {
    it('should return miniBlock details for a given miniBlockHash', async () => {
      const miniblock: string = 'e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4c';
      const expected = {
        miniBlockHash: "e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4c",
        receiverBlockHash: "ee60ef38ab592d4a32a3ba5783996ae72afda9d2bf40295fcf7c43915120227f",
        receiverShard: 2,
        senderBlockHash: "ee60ef38ab592d4a32a3ba5783996ae72afda9d2bf40295fcf7c43915120227f",
        senderShard: 2,
        timestamp: 1644529902,
        type: "TxBlock",
      };
      await request(app.getHttpServer())
        .get(`${path}/${miniblock}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual(expected);
        });
    });

    it('should return 400 Bad Request if an invalid miniBlockHash is given', async () => {
      const miniBlockHash: string = 'invalidMiniBlockHash';
      await request(app.getHttpServer())
        .get(`${path}/${miniBlockHash}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain("Validation failed");
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
