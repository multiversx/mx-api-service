import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MexFarm } from 'src/endpoints/mex/entities/mex.farm';
import { MexPair } from 'src/endpoints/mex/entities/mex.pair';
import { MexToken } from 'src/endpoints/mex/entities/mex.token';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("xExchange Controller", () => {
  let app: INestApplication;
  const path: string = "/mex";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/mex/economics', () => {
    it("should return economics details of xExchange ", async () => {
      await request(app.getHttpServer())
        .get(`${path}/economics`)
        .expect(200)
        .then(res => {
          expect(res.body.totalSupply).toBeDefined();
          expect(res.body.circulatingSupply).toBeDefined();
          expect(res.body.price).toBeDefined();
          expect(res.body.marketCap).toBeDefined();
          expect(res.body.volume24h).toBeDefined();
          expect(res.body.marketPairs).toBeDefined();
        });
    });
  });

  describe('/mex/pairs', () => {
    it("should returns 25 active liquidity pools available on xExchange", async () => {
      await request(app.getHttpServer())
        .get(`${path}/pairs`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<MexPair>);
          expect(res.body).toHaveLength(25);
        });
    });

    [
      {
        size: 60,
      },
      {
        size: 10,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} active liquidity pools available on xExchange`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/pairs?size=${size}`)
            .expect(200)
            .then(res => {
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });

    [
      {
        filter: 'exchange',
        value: 'xexchange',
      },
      {
        filter: 'exchange',
        value: 'unknown',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return active liquidity pools available on xExchange, filter by ${filter}=${value}`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/pairs?${filter}=${value}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeDefined();
              for (let i = 0; i < res.body.length; i++) {
                expect(res.body[i].exchange).toStrictEqual(value);
              }
            });
        });
      });
    });
  });

  describe('/mex/pairs/count', () => {
    it('should return active liquidity pools count available on Maiar Exchange', async () => {
      await request(app.getHttpServer())
        .get(`${path}/pairs/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(69);
        });
    });

    [
      {
        filter: 'exchange',
        value: 'xexchange',
        count: 69,
      },
      {
        filter: 'exchange',
        value: 'unknown',
        count: 0,
      },
    ].forEach(({ filter, value, count }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return active liquidity pools count available on Maiar Exchange, filter by ${filter}=${value}`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/pairs/count?${filter}=${value}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });

  describe('/mex/tokens', () => {
    it("should returns list of 25 tokens listed on xExchange ", async () => {
      await request(app.getHttpServer())
        .get(`${path}/tokens`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<MexToken>);
          expect(res.body).toHaveLength(25);
        });
    });

    [
      {
        size: 60,
      },
      {
        size: 10,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} tokens listed on xExchange`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/tokens?size=${size}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<MexToken>);
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });
  });

  describe('/mex/tokens/count', () => {
    it('should return tokens count available on Maiar Exchange', async () => {
      await request(app.getHttpServer())
        .get(`${path}/tokens/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(66);
        });
    });
  });

  describe('/mex/tokens/{identifier}', () => {
    it('should return a specific token listed on xExchange', async () => {
      const identifier: string = 'WEGLD-bd4d79';
      await request(app.getHttpServer())
        .get(`${path}/tokens/${identifier}`)
        .expect(200)
        .then(res => {
          expect(res.body.id).toStrictEqual(identifier);
          expect(res.body.symbol).toBeDefined();
          expect(res.body.name).toBeDefined();
          expect(res.body.price).toBeDefined();
        });
    });

    it('should return 400 Bad Request if an invalid identifier is given', async () => {
      const identifier: string = 'WEGLD';
      await request(app.getHttpServer())
        .get(`${path}/tokens/${identifier}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain("Validation failed");
        });
    });
  });

  describe('/mex/farms', () => {
    it("should returns list of 25 farms listed on xExchange ", async () => {
      await request(app.getHttpServer())
        .get(`${path}/farms`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<MexFarm>);
          expect(res.body).toHaveLength(25);
        });
    });

    [
      {
        size: 40,
      },
      {
        size: 17,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} farms listed on xExchange`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/farms?size=${size}`)
            .expect(200)
            .then(res => {
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });
  });

  describe('/mex/farms/count', () => {
    it('should return farms count available on Maiar Exchange', async () => {
      await request(app.getHttpServer())
        .get(`${path}/farms/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(43);
        });
    });
  });

  describe('/mex/pairs/{baseId}/{quoteId}', () => {
    it('should return liquidity pool details by providing a combination of two tokens', async () => {
      const baseId: string = 'BSK-baa025';
      const quoteId: string = 'WEGLD-bd4d79';
      await request(app.getHttpServer())
        .get(`${path}/pairs/${baseId}/${quoteId}`)
        .expect(200)
        .then(res => {
          expect(res.body.address).toBeDefined();
          expect(res.body.id).toBeDefined();
          expect(res.body.symbol).toBeDefined();
          expect(res.body.name).toBeDefined();
          expect(res.body.price).toBeDefined();
          expect(res.body.baseId).toStrictEqual(baseId);
          expect(res.body.basePrice).toBeDefined();
          expect(res.body.baseSymbol).toBeDefined();
          expect(res.body.baseName).toBeDefined();
          expect(res.body.quoteId).toStrictEqual(quoteId);
          expect(res.body.quotePrice).toBeDefined();
          expect(res.body.quoteSymbol).toBeDefined();
          expect(res.body.quoteName).toBeDefined();
          expect(res.body.totalValue).toBeDefined();
          expect(res.body.volume24h).toBeDefined();
          expect(res.body.state).toBeDefined();
          expect(res.body.type).toBeDefined();
          expect(res.body.exchange).toBeDefined();
        });
    });

    it('should return 404 Not Found if an invalid baseId is given', async () => {
      const baseId: string = 'invalidBaseId';
      const quoteId: string = 'WEGLD-bd4d79';
      await request(app.getHttpServer())
        .get(`${path}/pairs/${baseId}/${quoteId}`)
        .expect(404)
        .then(res => {
          expect(res.body.message).toContain("Not Found");
        });
    });

    it('should return 404 Not Found if an invalid quoteId is given', async () => {
      const baseId: string = 'BSK-baa025';
      const quoteId: string = 'WEGLD';
      await request(app.getHttpServer())
        .get(`${path}/pairs/${baseId}/${quoteId}`)
        .expect(404)
        .then(res => {
          expect(res.body.message).toContain("Not Found");
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
