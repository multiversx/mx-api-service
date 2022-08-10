import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("NFT Controller", () => {
  let app: INestApplication;
  const path: string = "/nfts";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/nfts', () => {
    it('should return a list of 25 Non-Fungible / Semi-Fungible / MetaESDT tokens available on blockchain', async () => {
      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);
        });
    });

    it('should return a list of 5 Non-Fungible / Semi-Fungible / MetaESDT tokens available on blockchain', async () => {
      const params = new URLSearchParams({
        'size': '5',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(5);
        });
    });

    it('should return a list of NFTs for a given collection identifier', async () => {
      const params = new URLSearchParams({
        'search': 'MEDAL-ae074f',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);
          expect(res.body[0].collection).toStrictEqual('MEDAL-ae074f');
        });
    });

    it('should return a specific NFT for a given NFT identifier', async () => {
      const params = new URLSearchParams({
        'identifiers': 'MEDAL-ae074f-78',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].collection).toStrictEqual('MEDAL-ae074f');
          expect(res.body[0].identifier).toStrictEqual('MEDAL-ae074f-78');
        });
    });

    test.each`
    types
    ${'NonFungibleESDT'}
    ${'SemiFungibleESDT'}
    ${'MetaESDT'}
    `
      (
        `for the given type $types, should return 25 tokens`,
        async ({ types }) => {
          const params = new URLSearchParams({
            'type': types,
          });

          await request(app.getHttpServer())
            .get(`${path}?${params}`)
            .expect(200)
            .then(res => {
              expect(res.body).toHaveLength(25);
              expect(res.body).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({ type: `${types}` }),
                ])
              );
            });
        });

    it('should return all NFTs that are whitelisted in storage', async () => {
      const params = new URLSearchParams({
        'isWhitelistedStorage': 'true',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);

          for (const response of res.body) {
            expect(response.isWhitelistedStorage).toStrictEqual(true);
          }
        });
    });

    it('should return a list of 25 esdts that are marked as scam', async () => {
      const params = new URLSearchParams({
        'isNsfw': 'true',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);

          for (const response of res.body) {
            expect(response.isNsfw).toStrictEqual(true);
          }
        });
    });

    it('should return a list of 25 NFTs that have owner', async () => {
      const params = new URLSearchParams({
        'withOwner': 'true',
        'type': 'NonFungibleESDT',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);

          for (const response of res.body) {
            expect(response.owner).toBeDefined();
            expect(response.type).toStrictEqual('NonFungibleESDT');
          }
        });
    });

    it('should return a list of 25 NFTs that have supply = 1', async () => {
      const params = new URLSearchParams({
        'withSupply': 'true',
        'type': 'NonFungibleESDT',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);

          for (const response of res.body) {
            expect(response.type).toStrictEqual('NonFungibleESDT');
            expect(response.supply).toStrictEqual('1');
          }
        });
    });

    it('should return a list of 25 SFTs that have supply', async () => {
      const params = new URLSearchParams({
        'withSupply': 'true',
        'type': 'SemiFungibleESDT',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);

          for (const response of res.body) {
            expect(response.type).toStrictEqual('SemiFungibleESDT');
            expect(response.supply).toBeDefined();
          }
        });
    });
  });

  describe('/nfts/count', () => {
    it('should returns the total number of Non-Fungible / Semi-Fungible / MetaESDT tokens', async () => {
      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(6788352);
        });
    });

    [
      {
        filter: 'type',
        value: 'NonFungibleESDT',
        count: 991113,
      },
      {
        filter: 'type',
        value: 'SemiFungibleESDT',
        count: 23101,
      },
      {
        filter: 'type',
        value: 'MetaESDT',
        count: 5748786,
      },
      {
        filter: 'collection',
        value: 'EROBOT-527a29',
        count: 200,
      },
      {
        filter: 'name',
        value: 'Elrond Robots #200',
        count: 49893,
      },
      {
        filter: 'tags',
        value: 'elrond',
        count: 298265,
      },
      {
        filter: 'isWhitelistedStorage',
        value: 'true',
        count: 733653,
      },
      {
        filter: 'hasUris',
        value: 'true',
        count: 928696,
      },
      {
        filter: 'isNsfw',
        value: 'true',
        count: 287,
      },
      {
        filter: 'before',
        value: '1660114204',
        count: 6781315,
      },
      {
        filter: 'after',
        value: '1660134204',
        count: 2,
      },

    ].forEach(({ filter, value, count }) => {
      describe(`filter = ${filter}`, () => {
        it(`should return total count based on ${filter} filter with value ${value}`, async () => {
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

  afterEach(async () => {
    await app.close();
  });
});
