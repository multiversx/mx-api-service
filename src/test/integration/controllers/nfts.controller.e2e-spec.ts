import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("NFT Controller", () => {
  let app: INestApplication;
  const route: string = "/nfts";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("/nfts - should return 200 status code and a list of nfts", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it(`/nfts - should return 400 status code if "withOwner" and "withSupply" flags are active`, async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '150',
      'withOwner': 'true',
      'withSupply': 'true',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(400)
      .then(res => {
        expect(res.body.message).toEqual("Maximum size of 100 is allowed when activating flags 'withOwner' or 'withSupply'");
      });
  });

  it("/nfts?withSupply - should return 200 status code and one list of nfts with filter withSupply", async () => {
    const params = new URLSearchParams({
      'withSupply': 'true',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts?withOwner - should return 200 status code and one list of nfts with filter withOwner", async () => {
    const params = new URLSearchParams({
      'withOwner': 'true',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts?hasUris - should return 200 status code and one list of nfts with filter hasUris", async () => {
    const params = new URLSearchParams({
      'hasUris': 'true',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts?isWhitelistedStorage - should return 200 status code and one list of nfts with filter isWhitelistedStorage", async () => {
    const params = new URLSearchParams({
      'isWhitelistedStorage': 'true',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts?creator - should return 200 status code and one list of nfts with filter creator", async () => {
    const params = new URLSearchParams({
      'creator': 'erd1qqqqqqqqqqqqqpgqnqvjnn4haygsw2hls2k9zjjadnjf9w7g2jpsmc60a4',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts?tags - should return 200 status code and one list of nfts with filter tags", async () => {
    const params = new URLSearchParams({
      'tags': 'Elrond,MAW',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts?name - should return 200 status code and one list of nfts filtered by name", async () => {
    const params = new URLSearchParams({
      'name': 'Elrond Robots #196',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  //TBD - if the collection does not exist to return 404 Not FOUND 
  it("/nfts?collection - should return 200 status code and one list of nfts filtered by collection", async () => {
    const params = new URLSearchParams({
      'collection': 'LKMEX-aab910',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts?type - should return 200 status code and one list of NonFungibleESDT", async () => {
    const params = new URLSearchParams({
      'type': 'NonFungibleESDT',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts?type - should return 200 status code and one list of nfts SemiFungibleESDT", async () => {
    const params = new URLSearchParams({
      'type': 'SemiFungibleESDT',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts?type - should return 200 status code and one list of nfts MetaESDT", async () => {
    const params = new URLSearchParams({
      'type': 'MetaESDT',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts?identifiers - should return 200 status code and one list of nfts with identifiers filter ", async () => {
    const params = new URLSearchParams({
      'identifiers': 'GCC-6b08ed-34,GCC-6b08ed-35',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts?from=&size&type - should return 200 status code and 10 NonFungibleESDT's ", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
      'type': 'NonFungibleESDT',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/nfts/count - should return 200 status code and nfts total count", async () => {
    await request(app.getHttpServer())
      .get(route + "/count")
      .expect(200);
  });

  it("/nfts/count?hasUris - should return 200 status code and count of nfts with uris", async () => {
    const params = new URLSearchParams({
      'hasUris': 'true',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nfts/count?creator - should return 200 status code and count of nfts with creator", async () => {
    const params = new URLSearchParams({
      'creator': 'erd1qqqqqqqqqqqqqpgq0p9k56lutyjsz288gsrtu64nfj43ll8vys5sjy7luv',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nfts/count?tags - should return 200 status code and count of nfts with tags", async () => {
    const params = new URLSearchParams({
      'tags': 'Elrond',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nfts/count?name - should return 200 status code and count of nfts with name", async () => {
    const params = new URLSearchParams({
      'name': 'Stramosi',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nfts/count?collection - should return 200 status code and count of nfts with collection", async () => {
    const params = new URLSearchParams({
      'collection': 'LKMEX-aab910',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nfts/count?type - should return 200 status code and count of NonFungibleESDT", async () => {
    const params = new URLSearchParams({
      'type': 'NonFungibleESDT',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nfts/count?type - should return 200 status code and count of SemiFungibleESDT", async () => {
    const params = new URLSearchParams({
      'type': 'SemiFungibleESDT',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nfts/count?type - should return 200 status code and count of MetaESDT", async () => {
    const params = new URLSearchParams({
      'type': 'MetaESDT',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nfts/count?identifiers - should return 200 status code and count of nfts with identifiers filters", async () => {
    const params = new URLSearchParams({
      'identifiers': 'GCC-6b08ed-34,GCC-6b08ed-35',
    });

    await request(app.getHttpServer())
      .get(route + "/count" + "?" + params)
      .expect(200);
  });

  it("/nfts/:identifier - should return 200 status code and nft details based on identifier", async () => {
    const identifier: string = "GCC-6b08ed-34";

    await request(app.getHttpServer())
      .get(route + "/" + identifier)
      .expect(200);
  });

  it("/nfts/:identifier - should return 404 status code Error: Not Found", async () => {
    const identifier: string = "GCC-6b08ed-34Test";

    await request(app.getHttpServer())
      .get(route + "/" + identifier)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("NFT not found");
      });
  });

  it("/nfts/:identifier/supply - should return 200 status code and nft details supply", async () => {
    const identifier: string = "GCC-6b08ed-34";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/supply")
      .expect(200);
  });

  it("/nfts/:identifier/owners - should return 200 status code and nft owners details", async () => {
    const identifier: string = "LKMEX-aab910-04";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/owners")
      .expect(200);
  });

  it("/nfts/:identifier/owners - should return 200 status code and nft owners details", async () => {
    const identifier: string = "LKMEX-aab910-04";
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
    });

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/owners" + "?" + params)
      .expect(200);
  });

  it("/nfts/:identifier/owners/count - should return 200 status code and nft owners count", async () => {
    const identifier: string = "LKMEX-aab910-04";

    await request(app.getHttpServer())
      .get(route + "/" + identifier + "/owners/count")
      .expect(200);
  });
});
