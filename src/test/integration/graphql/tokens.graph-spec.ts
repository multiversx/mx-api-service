import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Tokens', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Tokens', () => {
    it('should return 25 tokens', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            tokens(input:{
            }){
              identifier
              name
              ticker
              owner
              decimals
              isPaused
              assets{
                website
                description
                status
                pngUrl
                svgUrl
                ledgerSignature
              }
              transactions
              accounts
              canUpgrade
              canMint
              canBurn
              canChangeOwner
              canPause
              canFreeze
              canWipe
              price
              marketCap
              supply
              circulatingSupply
            }
          }`,
        })
        .expect(200)
        .then(res => {
          for (const item of res.body.data.tokens) {
            expect(item.identifier).toBeDefined();
          }
          expect(res.body.data.tokens).toBeDefined();
          expect(res.body.data.tokens).toHaveLength(25);
        });
    });

    it('should return token details when identifier filter is applied with value "MEX-455c57"', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            tokens(input:{
              identifier: "MEX-455c57"
            }){
              identifier
              name
              ticker
              owner
              decimals
              isPaused
              assets{
                website
                description
                status
                pngUrl
                svgUrl
                ledgerSignature
              }
              transactions
              accounts
              canUpgrade
              canMint
              canBurn
              canChangeOwner
              canPause
              canFreeze
              canWipe
              price
              marketCap
              supply
              circulatingSupply
            }
          }`,
        })
        .expect(200)
        .then(res => {
          for (const item of res.body.data.tokens) {
            expect(item.identifier).toStrictEqual("MEX-455c57");
          }
          expect(res.body.data.tokens).toHaveLength(1);
        });
    });

    it('should return tokens details when identifiers filter is applied with value "MEX-455c57" and "RIDE-7d18e9"', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            tokens(input:{
              identifiers: ["MEX-455c57","RIDE-7d18e9"]
            }){
              identifier
              name
              ticker
              owner
              decimals
              isPaused
              assets{
                website
                description
                status
                pngUrl
                svgUrl
                ledgerSignature
              }
              transactions
              accounts
              canUpgrade
              canMint
              canBurn
              canChangeOwner
              canPause
              canFreeze
              canWipe
              price
              marketCap
              supply
              circulatingSupply
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.tokens).toHaveLength(2);
          expect(res.body.data.tokens[0].identifier).toStrictEqual('MEX-455c57');
          expect(res.body.data.tokens[1].identifier).toStrictEqual('RIDE-7d18e9');
        });
    });
  });

  describe('GET - Token Supply', () => {
    it('should return supply details for a specific token', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            tokenSupply(input:{
              identifier: "MEX-455c57"
            }){
              burnt
              circulatingSupply
              initialMinted
              lockedAccounts{
                address
                balance
                name
              }
              minted
              supply
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.tokenSupply.burnt).toBeDefined();
          expect(res.body.data.tokenSupply.circulatingSupply).toBeDefined();
          expect(res.body.data.tokenSupply.initialMinted).toBeDefined();
          expect(res.body.data.tokenSupply.lockedAccounts).toBeDefined();
          expect(res.body.data.tokenSupply.minted).toBeDefined();
          expect(res.body.data.tokenSupply.supply).toBeDefined();
        });
    });
  });

  describe('GET - Token Roles', () => {
    it('should return roles details for a specific token', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            tokenRoles(input:{
              identifier:"MEX-455c57"
            }){
              address
              canLocalBurn
              canLocalMint
              roles
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.tokenRoles[0]).toEqual(expect.objectContaining({
            address: "erd1qqqqqqqqqqqqqpgqjpt0qqgsrdhp2xqygpjtfrpwf76f9nvg2jpsg4q7th",
            canLocalBurn: true,
            canLocalMint: true,
            roles: expect.arrayContaining([
              "ESDTRoleLocalMint",
              "ESDTRoleLocalBurn",
            ]),
          }));
        });
    });
  });

  describe('GET - Token Accounts', () => {
    it('should return all token accounts', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            tokenAccounts(input:{
              identifier: "MEX-455c57"
            }){
              address
              balance
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.tokenAccounts[0]).toEqual(expect.objectContaining({
            address: "erd1qqqqqqqqqqqqqpgq7qhsw8kffad85jtt79t9ym0a4ycvan9a2jps0zkpen",
            balance: res.body.data.tokenAccounts[0].balance,
          }));
        });
    });
  });

  describe('GET - Address Token Roles', () => {
    it('should return address token roles', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            tokenRolesAddress(input:{
              address: "erd1qqqqqqqqqqqqqpgq7qhsw8kffad85jtt79t9ym0a4ycvan9a2jps0zkpen",
              identifier: "MEX-455c57"
            }){
              canLocalBurn
              canLocalMint
              roles
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.tokenRolesAddress).toEqual(expect.objectContaining({
            canLocalBurn: true,
            canLocalMint: false,
            roles: expect.arrayContaining([
              "ESDTRoleLocalBurn",
            ]),
          }));
        });
    });
  });

  describe('GET - Tokens Count', () => {
    [
      {
        tokenFilter: 'name',
        value: '"MEX"',
        count: 3,
      },
      {
        tokenFilter: 'identifier',
        value: '"MEX-455c57"',
        count: 1,
      },
      {
        tokenFilter: 'identifiers',
        value: '["MEX-455c57", "RIDE-7d18e9"]',
        count: 2,
      },
    ].forEach(({ tokenFilter, value, count }) => {
      describe(`when filter ${tokenFilter} is applied`, () => {
        it(`should return tokens count`, async () => {
          await request(app.getHttpServer())
            .post(gql)
            .send({
              query: `{
                  tokensCount(input:{
                    ${tokenFilter}: ${value}
                  })
                }`,
            })
            .expect(200)
            .then(res => {
              expect(res.body.data.tokensCount).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
