import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Tag } from 'src/endpoints/nfttags/entities/tag';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');
import { URLSearchParams } from 'url';

describe("Tags Controller", () => {
  let app: INestApplication;
  const path: string = "/tags";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();


    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/tags', () => {
    it("should return 25 tags", async () => {
      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<Tag>);
          expect(res.body).toHaveLength(25);
        });
    });

    it('should return a list of 10 tags that contains "elrond" in tag name ', async () => {
      const params = new URLSearchParams({
        'search': 'elrond',
        'size': '10',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(10);
          expect(res.body[0].tag).toMatch('elrond');
        });
    });

    test.each`
        size
        ${25}
        ${55}
        ${4}
        ${10000}`
      (
        `should return a list of $size items`,
        async ({ size }) => {
          const params = new URLSearchParams({
            'size': size,
          });
          await request(app.getHttpServer())
            .get(`${path}?${params}`)
            .expect(200)
            .then(res => {
              expect(res.body).toHaveLength(size);
            });
        }
      );


    [
      {
        filter: 'search',
        value: 'elrond',
      },
      {
        filter: 'search',
        value: 'spacefox',
      },
      {
        filter: 'search',
        value: 'space',
      },
      {
        filter: 'search',
        value: 'game',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return a list of all NFT tags based on tag name ${value}`, async () => {
          await request(app.getHttpServer())
            .get(`${path}?${filter}=${value}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeDefined();
              expect(res.body).toBeInstanceOf(Array<Tag>);
              for (let i = 0; i < res.body.length; i++) {
                expect(res.body[i].tag).toMatch(value);
              }
            });
        });
      });
    });
  });

  describe('tags/count', () => {
    it('should return total number of NFTs tags', async () => {
      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(2500);
        });
    });

    it('should total number of distinct NFT tags', async () => {
      const params = new URLSearchParams({
        'search': 'elrond',
      });
      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(30);
        });
    });

    describe('tags/{tag}', () => {
      it('should return NFT tag details for a given tag', async () => {
        const tag: string = 'elrond';
        await request(app.getHttpServer())
          .get(`${path}/${tag}`)
          .expect(200)
          .then(res => {
            expect(res.body.tag).toMatch('elrond');
            expect(res.body.count).toBeGreaterThanOrEqual(3500);
          });
      });

      it('should return 404 "Nft tag not found"', async () => {
        const tag: string = 'vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv';
        await request(app.getHttpServer())
          .get(`${path}/${tag}`)
          .expect(404)
          .then(res => {
            expect(res.body.message).toStrictEqual("Nft tag not found");
          });
      });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
