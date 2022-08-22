import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Collection', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Collection Details', () => {
    it('should return collection details for a given NonFungibleESDT collection identifier', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            collection(input:{
              collection: "MEDAL-ae074f"
            }){
              collection
              type
              name
              ticker
              owner{
                address
              }
              timestamp
              canFreeze
              canWipe
              canPause
              canTransferNftCreateRole
              roles{
                address
                canCreate
                canBurn
                canAddQuantity
                canUpdateAttributes
                canAddUri
                canTransferRole
                roles
              }
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.collection).toBeDefined();
          expect(res.body.data.collection.collection).toStrictEqual('MEDAL-ae074f');
          expect(res.body.data.collection.type).toStrictEqual('NonFungibleESDT');
        });
    });
  });

  describe('Query - Get Collections Details', () => {
    it('should return 25 collections details', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            collections(input:{
          size:25}){
            collection
            type
            name
            ticker
            owner{
              address
            }
            timestamp
            canFreeze
            canWipe
            canPause
            canTransferNftCreateRole
          }
        }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.collections).toBeDefined();
          expect(res.body.data.collections).toHaveLength(25);
        });
    });

    test.each`
    types
    ${'NonFungibleESDT'}
    ${'SemiFungibleESDT'}
    ${'MetaESDT'}
    `
      (
        `for the given collection type $types, should return 25 collections`, async ({ types }) => {
          await request(app.getHttpServer())
            .post(gql)
            .send({
              query: `{
              collections(input:{
              type:${types}}){
              collection
              type
              name
              ticker
              owner{
                address
              }
              timestamp
              canFreeze
              canWipe
              canPause
              canTransferNftCreateRole
            }
          }`,
            })
            .expect(200)
            .then(res => {
              expect(res.body.data.collections).toHaveLength(25);
              for (const item of res.body.data.collections) {
                expect(item.type).toStrictEqual(types);
              }
            });
        }
      );

    it('should return 2 collections details for a given collection identifiers', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            collections(input:{
              identifiers:["MEDAL-ae074f","EROBOT-527a29"]
            }){
                collection
                type
                name
                ticker
                owner{
                  address
                }
                timestamp
                canFreeze
                canWipe
                canPause
                canTransferNftCreateRole
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.collections).toHaveLength(2);
          expect(res.body.data.collections[0].collection).toStrictEqual('MEDAL-ae074f');
          expect(res.body.data.collections[1].collection).toStrictEqual('EROBOT-527a29');

        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
