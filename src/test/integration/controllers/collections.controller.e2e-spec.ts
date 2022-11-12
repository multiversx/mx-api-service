import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("collections Controller", () => {
  let app: INestApplication;
  const path: string = "/collections";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/collections', () => {

    it('should return 25 collections', async () => {
      await request(app.getHttpServer())
        .get(path)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);
        });
    });

    it('should return 5 collections', async () => {
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

    it('should return collection detailes for a given identifier', async () => {
      const params = new URLSearchParams({
        'search': 'MEDAL-ae074f',
      });

      const expected =
        [
          {
            collection: "MEDAL-ae074f",
            type: "NonFungibleESDT",
            name: "GLUMedals",
            ticker: "MEDAL-ae074f",
            owner: "erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj",
            timestamp: 1654019676,
            canFreeze: false,
            canWipe: false,
            canPause: false,
            canTransfer: false,
            canTransferNftCreateRole: false,
            roles: [],
            traits: [],
          }];

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual(expected);
        });
    });

    it('should return two collections details', async () => {
      const params = new URLSearchParams({
        'identifiers': 'MEDAL-ae074f,EROBOT-527a29',
      });

      const expected =
        [
          {
            collection: "MEDAL-ae074f",
            type: "NonFungibleESDT",
            name: "GLUMedals",
            ticker: "MEDAL-ae074f",
            owner: "erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj",
            timestamp: 1654019676,
            canFreeze: false,
            canWipe: false,
            canPause: false,
            canTransfer: false,
            canTransferNftCreateRole: false,
            roles: [],
            traits: [],
          },
          {
            collection: "EROBOT-527a29",
            type: "NonFungibleESDT",
            name: "eRobots",
            ticker: "EROBOT-527a29",
            owner: "erd1nz42knvgmxpevepsyvq9dx3wzdgtd6lmu96y28tuupayazgx4fvs3w9d09",
            timestamp: 1638990678,
            canFreeze: false,
            canWipe: false,
            canPause: false,
            canTransfer: false,
            canTransferNftCreateRole: false,
            roles: [],
            traits: [],
          },
        ];

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual(expected);
        });
    });

    it('should return one collection details based on canCreate role address', async () => {
      const params = new URLSearchParams({
        'canCreate': 'erd1qqqqqqqqqqqqqpgq09vq93grfqy7x5fhgmh44ncqfp3xaw57ys5s7j9fed',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('should return one collection details based on canBurn role address', async () => {
      const params = new URLSearchParams({
        'canCreate': 'erd1kj2tpra7e5vayparwv0fzhgsmnrw442r5u53sphjfs2h8lrl54sstuf6y4',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    test.each`
  types
  ${'NonFungibleESDT'}
  ${'SemiFungibleESDT'}
  ${'MetaESDT'}
  `
      (
        `for the given collection type $types, should return 25 collections`,
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
        }
      );
  });

  describe('/collections/count', () => {
    it('should return total collections count', async () => {
      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(6200);
        });
    });

    it('should count for a given collection identifier', async () => {
      const params = new URLSearchParams({
        'search': 'MEDAL-ae074f',
      });

      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(1);
        });
    });

    test.each`
    types
    ${'NonFungibleESDT'}
    ${'SemiFungibleESDT'}
    ${'MetaESDT'}
    `
      (
        `for the given collection type $types, should return collections count`,
        async ({ types }) => {
          const params = new URLSearchParams({
            'type': types,
          });

          await request(app.getHttpServer())
            .get(`${path}/count?${params}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(40);
            });
        }
      );

    it('should return collection count based on canCreate role address', async () => {
      const params = new URLSearchParams({
        'canCreate': 'erd1qqqqqqqqqqqqqpgq09vq93grfqy7x5fhgmh44ncqfp3xaw57ys5s7j9fed',
      });

      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(1);
        });
    });

    it('should return collection count based on canBurn role address', async () => {
      const params = new URLSearchParams({
        'canCreate': 'erd1kj2tpra7e5vayparwv0fzhgsmnrw442r5u53sphjfs2h8lrl54sstuf6y4',
      });

      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('collections/{collection}', () => {
    it('should return collection details for a given identifier', async () => {
      const identifier: string = 'MEDAL-ae074f';
      const expected =
      {
        collection: "MEDAL-ae074f",
        type: "NonFungibleESDT",
        name: "GLUMedals",
        ticker: "MEDAL-ae074f",
        owner: "erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj",
        timestamp: 1654019676,
        canFreeze: false,
        canWipe: false,
        canPause: false,
        canTransfer: true,
        canTransferNftCreateRole: false,
        roles: [
          {
            address: "erd1qqqqqqqqqqqqqpgq8ne37ed06034qxfhm09f03ykjfqwx8s7hvrqackmzt",
            canCreate: true,
            canBurn: false,
            canAddQuantity: false,
            canUpdateAttributes: false,
            canAddUri: false,
            roles: [
              "ESDTRoleNFTCreate",
            ],
          },
        ],
        traits: [],
      };

      await request(app.getHttpServer())
        .get(`${path}/${identifier}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual(expected);
        });
    });
  });

  describe('/collections/{identifier}/nfts', () => {
    it('should return 25 NFTs from a given collection', async () => {
      const identifier: string = 'MEDAL-ae074f';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}/nfts`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);
        });
    });

    it('should return 5 NFTs from a given collection', async () => {
      const identifier: string = 'MEDAL-ae074f';
      const params = new URLSearchParams({
        'size': '5',
      });

      await request(app.getHttpServer())
        .get(`${path}/${identifier}/nfts?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(5);
        });
    });
  });

  describe('/collections/{identifier}/nfts/count', () => {
    it('should return total number of NFTs from a given collection', async () => {
      const identifier: string = 'MEDAL-ae074f';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}/nfts/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toStrictEqual(120);
        });
    });
  });

  describe('Validations', () => {
    it('should return 400 Bad Request if collection identifier does not contain the right format', async () => {
      const identifier: string = 'MEDALae074f';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toEqual("Validation failed for argument 'collection': Invalid collection identifier.");
        });
    });

    it('should return 400 Bad Request if collection type is not correct', async () => {
      const params = new URLSearchParams({
        'type': 'NONFungibleESDT',
      });
      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toEqual("Validation failed for argument 'type' (one of the following values is expected: NonFungibleESDT, SemiFungibleESDT, MetaESDT)");
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
