import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Maiar Exchange', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Mex Economics', () => {
    it('should returns economics details of Maiar Exchange', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            mexEconomics{
              totalSupply
              circulatingSupply
              price
              marketCap
              volume24h
              marketPairs
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.mexEconomics).toBeDefined();
        });
    });
  });

  describe('Query - Get Mex Pairs', () => {
    it('should returns economics details of Maiar Exchange', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            mexPairs(input:{
            }){
              address
              id
              symbol
              name
              price
              baseId
              basePrice
              baseSymbol
              baseName
              quoteId
              quotePrice
              quoteSymbol
              quoteName
              totalValue
              volume24h
              state
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.mexPairs).toBeDefined();
        });
    });
  });

  describe('Query - Get Mex Pair', () => {
    it('should returns liquidity pool details by providing a combination of two tokens', async () => {
      const mexPairInput = {
        baseId: `"MEX-455c57"`,
        quoteId: `"WEGLD-bd4d79"`,
      };
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            mexPair(input:{
              baseId: ${mexPairInput.baseId}, quoteId: ${mexPairInput.quoteId}
            }){
              address
              id
              symbol
              name
              price
              baseId
              basePrice
              baseSymbol
              baseName
              quoteId
              quotePrice
              quoteSymbol
              quoteName
              totalValue
              volume24h
              state
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.mexPair).toBeDefined();
        });
    });

    it('should returns "Mex pair not found" if baseId or quoteId are not found', async () => {
      const mexPairInput = {
        baseId: `"Invalid-455c57"`,
        quoteId: `"WEGLD-bd4d79"`,
      };
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            mexPair(input:{
              baseId: ${mexPairInput.baseId}, quoteId: ${mexPairInput.quoteId}
            }){
              address
              id
              symbol
              name
              price
              baseId
              basePrice
              baseSymbol
              baseName
              quoteId
              quotePrice
              quoteSymbol
              quoteName
              totalValue
              volume24h
              state
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.errors[0].message).toStrictEqual('Mex pair not found');
        });
    });
  });

  describe('Query - Get Mex Tokens', () => {
    it('should returns a list of tokens listed on Maiar Exchange', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            mexTokens(input:{
            }){
              id
              symbol
              name
              price
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.mexTokens).toBeDefined();
        });
    });

    it('should returns a list of tokens listed on Maiar Exchange', async () => {
      const mexTokenIdentifier = {
        id: `"MEX-455c57"`,
      };
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            mexToken(input:{
              id: ${mexTokenIdentifier.id}
            }){
              id
              symbol
              name
              price
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.mexToken.id).toStrictEqual('MEX-455c57');
        });
    });

    it('should returns "Mex token not found" if token identifier is not valid', async () => {
      const mexTokenIdentifier = {
        id: `"Invalid-455c57"`,
      };
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            mexToken(input:{
              id: ${mexTokenIdentifier.id}
            }){
              id
              symbol
              name
              price
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.errors[0].message).toStrictEqual('Mex token not found');
          expect(res.body.errors[0].extensions.code).toStrictEqual('404');
        });
    });
  });

  describe('Query - Get Mex Farms', () => {
    it('should returns a list of farms listed on Maiar Exchange', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            mexFarms(input:{
            }){
              type
              address
              id
              symbol
              name
              price
              farmingId
              farmingSymbol
              farmingName
              farmingPrice
              farmedId
              farmedSymbol
              farmedName
              farmedPrice
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.mexFarms).toBeDefined();
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
