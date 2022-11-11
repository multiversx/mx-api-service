import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('DappConfig', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Configuration used in dapps', () => {
    it('should return dapp configuration', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            dappConfig{
              id
              name
              egldLabel
              decimals
              egldDenomination
              gasPerDataByte
              apiTimeout
              walletConnectDeepLink
              walletConnectBridgeAddresses
              walletAddress
              apiAddress
              explorerAddress
              chainId
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.dappConfig).toBeDefined();
        });
    });
  });
});
