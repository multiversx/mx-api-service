import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Nfts', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Query - Get NFT details', () => {
    it('should return NonFungibleESDT token details for a given NFT identifier', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            nft(input:{
              identifier:"CATSFAM-46c28f-0211"
            }){
             identifier
              attributes
              nonce
              type
              name
              creator{
                address
              }
              royalties
              uris
              url
              media{
                url
                originalUrl
                thumbnailUrl
                fileType
                fileSize
              }
              isWhitelistedStorage
              owner{
                address
              }
              supply
              ticker
          }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.nft).toBeDefined();
          expect(res.body.data.nft.identifier).toStrictEqual('CATSFAM-46c28f-0211');
        });
    });

    describe('Query - Get NFT details', () => {
      it('should return MetaESDT token details for a given MetaESDT identifier', async () => {
        await request(app.getHttpServer())
          .post(gql)
          .send({
            query: `{
              nft(input:{
                identifier:"XMEX-fda355-15"
              }){
               identifier
                attributes
                nonce
                type
                name
                creator{
                  address
                }
                royalties
                uris
                url
                media{
                  url
                  originalUrl
                  thumbnailUrl
                  fileType
                  fileSize
                }
                isWhitelistedStorage
                owner{
                  address
                }
                supply
                ticker
                unlockEpoch
            }
            }`,
          })
          .expect(200)
          .then(res => {
            expect(res.body.data.nft).toBeDefined();
            expect(res.body.data.nft.identifier).toStrictEqual('XMEX-fda355-15');
            expect(res.body.data.nft.unlockEpoch).toStrictEqual(1410);
          });
      });
    });

    test.each`
    types
    ${'NonFungibleESDT'}
    ${'SemiFungibleESDT'}`
      (
        `for the given type $types, should return 10 esdt tokens`, async ({ types }) => {
          await request(app.getHttpServer())
            .post(gql)
            .send({
              query: `{
                nfts(input:{
                  type: ${types}, size:10
                }){
                  identifier
                  timestamp
                  attributes
                  nonce
                  type
                  name
                  creator{
                    address
                  }
                  royalties
                  url
                  media{
                    url
                    originalUrl
                    thumbnailUrl
                    fileType
                    fileSize
                  }
                  isWhitelistedStorage
                  tags
                  ticker
                }
              }`,
            })
            .expect(200)
            .then(res => {
              expect(res.body.data.nfts).toHaveLength(10);
              for (const item of res.body.data.nfts) {
                expect(item.type).toStrictEqual(types);
              }
            });
        }
      );

    it('should return NonFugibleESDTs details based on two NFT identifiers', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            nfts(input:{
              identifiers: ["MOS-b9b4b2-2710", "MEDAL-ae074f-78"]
            }){
              identifier
              timestamp
              attributes
              nonce
              type
              name
              creator{
                address
              }
              royalties
              url
              media{
                url
                originalUrl
                thumbnailUrl
                fileType
                fileSize
              }
              isWhitelistedStorage
              tags
              ticker
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.nfts).toBeDefined();
          expect(res.body.data.nfts[0].identifier).toStrictEqual('MEDAL-ae074f-78');
          expect(res.body.data.nfts[1].identifier).toStrictEqual('MOS-b9b4b2-2710');
        });
    });
  });

  describe('Query - Get Count', () => {
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
        count: 1008974,
      },
      {
        filter: 'after',
        value: '1660134204',
        count: 2,
      },
      {
        filter: 'nonce',
        value: '200',
        count: 200,
      },

    ].forEach(({ filter, value, count }) => {
      describe(`filter = ${filter}`, () => {
        it(`should return total count based on ${filter} filter with value ${value}`, async () => {
          await request(app.getHttpServer())
            .post(gql)
            .send({
              query: `{nftsCount(input:{
              ${filter}: ${value}
            })
          }`,
            })
            .expect(200)
            .then(res => {
              expect(res.body.data.nftsCount).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });
});
