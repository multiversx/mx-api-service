import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');
import { URLSearchParams } from 'url';

describe("Tags Controller", () => {
  let app: INestApplication;
  const path: string = "/tags";

  beforeEach(async () => {
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
  });

  afterEach(async () => {
    await app.close();
  });
});
