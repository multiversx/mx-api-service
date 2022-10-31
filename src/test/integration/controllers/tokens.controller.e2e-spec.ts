import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Tokens Controller", () => {
  let app: INestApplication;
  const path: string = "/tokens";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });


  describe('/tokens', () => {
    [
      {
        filter: undefined,
        value: undefined,
        lenght: 25,
      },
      {
        filter: 'size',
        value: '5',
        lenght: 5,
      },
    ].forEach(({ filter, value, lenght }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return ${lenght} tokens based on value ${value}`, async () => {
          await request(app.getHttpServer())
            .get(`${path}?${filter}=${value}`)
            .expect(200)
            .then(res => {
              expect(res.body).toHaveLength(parseInt(`${lenght}`));
            });
        });
      });
    });

    [
      {
        filter: 'search',
        value: 'MEX-455c57',
      },
      {
        filter: 'name',
        value: 'MEX',
      },
      {
        filter: 'identifier',
        value: 'MEX-455c57',
      },
      {
        filter: 'identifiers',
        value: 'MEX-455c57',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return token details based on value ${value}`, async () => {
          await request(app.getHttpServer())
            .get(`${path}?${filter}=${value}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeDefined();
              expect(res.body[0].identifier).toStrictEqual('MEX-455c57');
              expect(res.body[0].owner).toStrictEqual('erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97');
              expect(res.body[0].assets).toBeDefined();
            });
        });
      });
    });

    [
      {
        filter: 'sort',
        value: 'accounts',
      },
      {
        filter: 'sort',
        value: 'transactions',
      },
      {
        filter: 'sort',
        value: 'price',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return tokens details based on ${filter} with value ${value} and ordered descendent `, async () => {
          const order = 'desc';

          await request(app.getHttpServer())
            .get(`${path}?${filter}=${value}&${order}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeDefined();
              expect(res.body[0].transactions).toBeGreaterThan(res.body[1].transactions);
            });
        });
      });
    });
  });

  describe('/tokens/count', () => {
    [
      {
        filter: 'search',
        value: 'RIDE',
        count: 2,
      },
      {
        filter: 'name',
        value: 'MEX',
        count: 1,
      },
      {
        filter: 'identifier',
        value: 'MEX-455c57',
        count: 1,
      },
    ].forEach(({ filter, value, count }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return tokens count based on ${filter} with value ${value}`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/count?${filter}=${value}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });

  describe('/tokens/{identifier}', () => {
    it('should return token details based on a specific token identifier', async () => {
      const identifier: string = 'MEX-455c57';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}`)
        .expect(200)
        .then(res => {
          expect(res.body.identifier).toStrictEqual(identifier);
          expect(res.body.name).toStrictEqual('MEX');
          expect(res.body.ticker).toStrictEqual('MEX');
          expect(res.body.owner).toStrictEqual('erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97');
          expect(res.body.decimals).toStrictEqual(18);
          expect(res.body.isPaused).toStrictEqual(false);
          expect(res.body.transactions).toBeGreaterThanOrEqual(1504696);
          expect(res.body.accounts).toBeGreaterThanOrEqual(11021);
          expect(res.body.assets).toBeDefined();

          expect(res.body.canUpgrade).toStrictEqual(true);
          expect(res.body.canMint).toStrictEqual(true);
          expect(res.body.canBurn).toStrictEqual(true);
          expect(res.body.canChangeOwner).toStrictEqual(true);
          expect(res.body.canPause).toStrictEqual(true);
          expect(res.body.canFreeze).toStrictEqual(true);
          expect(res.body.canWipe).toStrictEqual(true);
        });
    });

    it('should returns general supply information for a specific token', async () => {
      const identifier: string = 'MEX-455c57';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}/supply`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeDefined();
          expect(res.body.supply).toBeDefined();
          expect(res.body.circulatingSupply).toBeDefined();
          expect(res.body.minted).toBeDefined();
          expect(res.body.burnt).toBeDefined();
          expect(res.body.initialMinted).toBeDefined();
        });
    });

    it('should returns general supply information for a specific token', async () => {
      const identifier: string = 'MEX-455c57';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}/supply`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeDefined();
          expect(res.body.supply).toBeDefined();
          expect(res.body.circulatingSupply).toBeDefined();
          expect(res.body.minted).toBeDefined();
          expect(res.body.burnt).toBeDefined();
          expect(res.body.initialMinted).toBeDefined();
        });
    });

    it('should returns a list of accounts that hold a specific token', async () => {
      const identifier: string = 'MEX-455c57';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}/accounts`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);
          expect(res.body[0].address).toStrictEqual('erd1qqqqqqqqqqqqqpgq7qhsw8kffad85jtt79t9ym0a4ycvan9a2jps0zkpen');
        });
    });

    it('should returns the total number of accounts that hold a specific token', async () => {
      const identifier: string = 'MEX-455c57';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}/accounts/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(50679);
        });
    });

    it('should a list of accounts that can perform various actions on a specific token', async () => {
      const identifier: string = 'MEX-455c57';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}/roles`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(17);

          for (const item of res.body) {
            expect(item.address).toBeDefined();
            expect(item.canLocalMint).toBeDefined();
            expect(item.canLocalBurn).toBeDefined();
            expect(item.roles).toBeDefined();
          }
        });
    });

    it('should returns roles detalils for a specific address of a given token', async () => {
      const identifier: string = 'MEX-455c57';
      const address: string = 'erd1qqqqqqqqqqqqqpgqjpt0qqgsrdhp2xqygpjtfrpwf76f9nvg2jpsg4q7th';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}/roles/${address}`)
        .expect(200)
        .then(res => {
          expect(res.body.canLocalMint).toStrictEqual(true);
          expect(res.body.canLocalBurn).toStrictEqual(true);
          expect(res.body.roles[0]).toStrictEqual('ESDTRoleLocalMint');
          expect(res.body.roles[1]).toStrictEqual('ESDTRoleLocalBurn');
        });
    });
  });

  describe('Validations', () => {
    it('should return 400 Status Code if given token identifier is invalid', async () => {
      const identifier: string = 'abc123';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toEqual("Validation failed for argument 'identifier': Invalid token identifier.");
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
