import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { NetworkController } from "src/endpoints/network/network.controller";
import { NetworkModule } from "src/endpoints/network/network.module";
import { NetworkService } from "src/endpoints/network/network.service";
import { mockNetworkService } from "./services.mock/network.service.mock";
import { NetworkConstants } from "src/endpoints/network/entities/constants";
import request = require('supertest');
import { Economics } from "src/endpoints/network/entities/economics";
import { Stats } from "src/endpoints/network/entities/stats";
import { About } from "src/endpoints/network/entities/about";

describe("NetworkController", () => {
  let app: INestApplication;
  const networkServiceMocks = mockNetworkService();

  beforeAll(async () => {
    jest.resetAllMocks();
    const moduleFixture = await Test.createTestingModule({
      controllers: [NetworkController],
      imports: [NetworkModule],
    })
      .overrideProvider(NetworkService)
      .useValue(networkServiceMocks)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe("GET /network", () => {
    it('should return network constants details', async () => {
      const mockConstants: NetworkConstants = {
        chainId: "1",
        gasPerDataByte: 1500,
        minGasLimit: 50000,
        minGasPrice: 1000000000,
        minTransactionVersion: 1,
        gasPriceModifier: "0.000000000000000000",
      };
      networkServiceMocks.getConstants.mockResolvedValue(mockConstants);

      await request(app.getHttpServer())
        .get('/constants')
        .expect(200)
        .expect(response => {
          expect(response.body).toMatchObject(mockConstants);
        });
    });

    it('should return network economics details', async () => {
      const mockEconomics: Economics = {
        totalSupply: 26625892,
        circulatingSupply: 26620740,
        staked: 17516922,
        price: 58.84,
        marketCap: 1566364342,
        apr: 0.076523,
        topUpApr: 0.052561,
        baseApr: 0.104972,
        tokenMarketCap: 552829990,
      };
      networkServiceMocks.getEconomics.mockResolvedValue(mockEconomics);

      await request(app.getHttpServer())
        .get('/economics')
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockEconomics);
        });
    });

    it('should return network stats details', async () => {
      const mockStats: Stats = {
        shards: 3,
        blocks: 75177896,
        accounts: 2837831,
        transactions: 388115542,
        scResults: 292978375,
        refreshRate: 6000,
        epoch: 1305,
        roundsPassed: 14136,
        roundsPerEpoch: 14400,
      };
      networkServiceMocks.getStats.mockResolvedValue(mockStats);

      await request(app.getHttpServer())
        .get('/stats')
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockStats);
        });
    });

    it('should return network about details', async () => {
      const mockAbout: About = {
        appVersion: "93a9abd0033050e46242836c6cf12e7b396e294c",
        pluginsVersion: "ad95f80e544b10accf56d8ae5deb0299d6a6a5de",
        network: "mainnet",
        cluster: "mainnet-aws-fra",
        version: "v1.3.0-hotfix2-next",
        indexerVersion: "v1.4.19",
        gatewayVersion: "v1.1.44-0-g5282fa5",
        scamEngineVersion: "1.0.0",
        features: {
          updateCollectionExtraDetails: true,
          marketplace: true,
          exchange: true,
          dataApi: true,
        },
      };
      networkServiceMocks.getAbout.mockResolvedValue(mockAbout);

      await request(app.getHttpServer())
        .get('/about')
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockAbout);
        });
    });
  });
});
