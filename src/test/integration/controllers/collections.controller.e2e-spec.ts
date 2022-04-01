import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("collections Controller", () => {
  let app: INestApplication;
  const route: string = "/collections";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("/collections - should return 200 status code and a list of collections details", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/collections?from&size - should return 200 status code and a list of 100 collections details", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '100',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/collections?fcreator - should return 200 status code and a list of collection of creator details", async () => {
    const params = new URLSearchParams({
      'creator': 'erd1qqqqqqqqqqqqqpgq0p9k56lutyjsz288gsrtu64nfj43ll8vys5sjy7luv',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/collections?type - should return 200 status code and a list of NonFungibleESDT collection details", async () => {
    const params = new URLSearchParams({
      'type': 'NonFungibleESDT',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/collections?type - should return 200 status code and a list of 10 NonFungibleESDT collections details", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
      'type': 'NonFungibleESDT',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/collections?type - should return 200 status code and a list of SemiFungibleESDT collection details", async () => {
    const params = new URLSearchParams({
      'type': 'SemiFungibleESDT',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/collections?type - should return 200 status code and a list of 10 SemiFungibleESDT collections details", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
      'type': 'SemiFungibleESDT',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/collections?type - should return 200 status code and a list of MetaESDT collection details", async () => {
    const params = new URLSearchParams({
      'type': 'MetaESDT',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/collections?type - should return 200 status code and a list of 10 MetaESDT collections details", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
      'type': 'MetaESDT',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/collections?identifiers - should return 200 status code and one collection details based on identifier filter", async () => {
    const params = new URLSearchParams({
      'identifiers': 'PEACE-086f39',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/collections?identifiers - should return 200 status code and two collections details based on identifier filter", async () => {
    const params = new URLSearchParams({
      'identifiers': 'PEACE-086f39,MOS-b9b4b2',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/collections/count - should return 200 status code and collections count", async () => {
    await request(app.getHttpServer())
      .get(route + "/count")
      .expect(200);
  });

  it("/collections/count?creator - should return 200 status code and creator collections count", async () => {
    const params = new URLSearchParams({
      'creator': 'erd1qqqqqqqqqqqqqpgq0p9k56lutyjsz288gsrtu64nfj43ll8vys5sjy7luv',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/collections/count?type - should return 200 status code and NonFungibleESDT collections count", async () => {
    const params = new URLSearchParams({
      'type': 'NonFungibleESDT',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/collections/count?type - should return 200 status code and SemiFungibleESDT collections count", async () => {
    const params = new URLSearchParams({
      'type': 'SemiFungibleESDT',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/collections/count?type - should return 200 status code and MetaESDT collections count", async () => {
    const params = new URLSearchParams({
      'type': 'MetaESDT',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/collections/count?creator&type - should return 200 status code and collection count of type NonFungibleESDT for a specific creator", async () => {
    const params = new URLSearchParams({
      'creator': 'erd1qqqqqqqqqqqqqpgq0p9k56lutyjsz288gsrtu64nfj43ll8vys5sjy7luv',
      'type': 'NonFungibleESDT',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/collections/count?creator&type - should return 200 status code and collection count of type SemiFungibleESDT for a specific creator", async () => {
    const params = new URLSearchParams({
      'creator': 'erd1qqqqqqqqqqqqqpgq0p9k56lutyjsz288gsrtu64nfj43ll8vys5sjy7luv',
      'type': 'SemiFungibleESDT',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/collections/count?creator&type - should return 200 status code and collection count of type MetaESDT for a specific creator", async () => {
    const params = new URLSearchParams({
      'creator': 'erd1qqqqqqqqqqqqqpgq0p9k56lutyjsz288gsrtu64nfj43ll8vys5sjy7luv',
      'type': 'MetaESDT',
    });
    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/collections/:collection - should return 200 status code and collection details for a specifc collection", async () => {
    const collection: string = "MOS-b9b4b2";

    await request(app.getHttpServer())
      .get(route + "/" + collection)
      .expect(200);
  });

  it("/collections/:collection - should return 404 status code Error Code: NFT Collection not found", async () => {
    const collection: string = "MOS-b9b4b2T";

    await request(app.getHttpServer())
      .get(route + "/" + collection)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("NFT collection not found");
      });
  });
});
