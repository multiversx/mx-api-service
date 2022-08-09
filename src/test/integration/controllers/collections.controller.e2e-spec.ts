import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("collections Controller", () => {
  let app: INestApplication;
  const path: string = "/collections";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/collections -> should return 25 collections', async () => {
    await request(app.getHttpServer())
      .get(path)
      .expect(200)
      .then(res => {
        expect(res.body).toHaveLength(25);
      });
  });

  it('/collections -> should return 5 collections', async () => {
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

  it('/collections -> should return collection detailes for a given identifier', async () => {
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
          canTransferNftCreateRole: false,
          roles: [],
        }];

    await request(app.getHttpServer())
      .get(`${path}?${params}`)
      .expect(200)
      .then(res => {
        expect(res.body).toStrictEqual(expected);
      });
  });

  it('/collections -> should return two collections details', async () => {
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
          canTransferNftCreateRole: false,
          roles: [],
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
          canTransferNftCreateRole: false,
          roles: [],
        },
      ];

    await request(app.getHttpServer())
      .get(`${path}?${params}`)
      .expect(200)
      .then(res => {
        expect(res.body).toStrictEqual(expected);
      });
  });

  it('/collections -> should return one collection details based on canCreate role address', async () => {
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

  it('/collections -> should return one collection details based on canBurn role address', async () => {
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
