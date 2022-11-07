import { Test } from "@nestjs/testing";
import { NetworkConstants } from "src/endpoints/network/entities/constants";
import { NetworkConfig } from "src/endpoints/network/entities/network.config";
import { Economics } from "src/endpoints/network/entities/economics";
import '@elrondnetwork/erdnest/lib/src/utils/extensions/jest.extensions';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/array.extensions';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/number.extensions';
import { PublicAppModule } from "src/public.app.module";
import { Stats } from 'src/endpoints/network/entities/stats';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { Auction } from 'src/common/gateway/entities/auction';
import { AuctionNode } from 'src/common/gateway/entities/auction.node';
import { CachingService } from "@elrondnetwork/erdnest";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { About } from "src/endpoints/network/entities/about";
import { NetworkService } from "src/endpoints/network/network.service";

describe('Network Service', () => {
  let networkService: NetworkService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    networkService = moduleRef.get<NetworkService>(NetworkService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe('Get Constants', () => {
    it('should return network constants', async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      const constants = await networkService.getConstants();
      expect(constants).toHaveStructure(Object.keys(new NetworkConstants()));
    });
  });

  describe('Get Network Config', () => {
    it('should return network configuration', async () => {
      const networkConfig = await networkService.getNetworkConfig();
      expect(networkConfig).toHaveStructure(Object.keys(new NetworkConfig()));
    });
  });

  describe('Get Economics Raw', () => {
    it('should return economic raw properties', async () => {
      expect.assertions(1);
      const results = await networkService.getEconomicsRaw();
      expect(results).toHaveStructure(Object.keys(new Economics()));
    });
  });

  describe('Get Economics', () => {
    it('should return economics properties', async () => {
      const results = await networkService.getEconomics();

      expect(results).toEqual(expect.objectContaining({
        apr: expect.any(Number),
        baseApr: expect.any(Number),
        circulatingSupply: expect.any(Number),
        staked: expect.any(Number),
        topUpApr: expect.any(Number),
        totalSupply: expect.any(Number),
      }));
    });
  });

  describe("getStats", () => {
    it("should return status network", async () => {
      const status = await networkService.getStats();

      expect(status).toHaveStructure(Object.keys(new Stats()));
    });
  });

  describe("Get APR", () => {
    it("should return APR, toUpAPR, baseAPR", async () => {
      const results = await networkService.getApr();

      expect(results.hasOwnProperty("apr")).toBeTruthy();
      expect(results.hasOwnProperty("topUpApr")).toBeTruthy();
      expect(results.hasOwnProperty("baseApr")).toBeTruthy();
    });
  });

  describe("getMinimumAuctionTopUp", () => {
    it("Should correctly calculate minimum auction topup", async () => {
      jest.spyOn(GatewayService.prototype, "getValidatorAuctions")
        .mockImplementation(jest.fn(() => Promise.resolve([
          new Auction({
            "qualifiedTopUp": "2500000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2400000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "0",
            "auctionList": [
              new AuctionNode({ "selected": false }),
            ],
          }),
        ])));

      const minimumAuctionTopUp = await networkService.getMinimumAuctionTopUp();

      expect(minimumAuctionTopUp).toStrictEqual('2400000000000000000000');
    });

    it("Should correctly calculate minimum auction topup even if values come sorted wrongly", async () => {
      jest.spyOn(GatewayService.prototype, "getValidatorAuctions")
        .mockImplementation(jest.fn(() => Promise.resolve([
          new Auction({
            "qualifiedTopUp": "2400000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2500000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "0",
            "auctionList": [
              new AuctionNode({ "selected": false }),
            ],
          }),
        ])));

      const minimumAuctionTopUp = await networkService.getMinimumAuctionTopUp();

      expect(minimumAuctionTopUp).toStrictEqual('2400000000000000000000');
    });

    it("Should return correctly minimum auction topup if all values are selected", async () => {
      jest.spyOn(GatewayService.prototype, "getValidatorAuctions")
        .mockImplementation(jest.fn(() => Promise.resolve([
          new Auction({
            "qualifiedTopUp": "2500000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2400000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2300000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
        ])));

      const minimumAuctionTopUp = await networkService.getMinimumAuctionTopUp();

      expect(minimumAuctionTopUp).toStrictEqual('2300000000000000000000');
    });

    it("Should return undefined as minimum auction topup if all values are not selected", async () => {
      jest.spyOn(GatewayService.prototype, "getValidatorAuctions")
        .mockImplementation(jest.fn(() => Promise.resolve([
          new Auction({
            "qualifiedTopUp": "2500000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": false }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2400000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": false }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2300000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": false }),
            ],
          }),
        ])));

      const minimumAuctionTopUp = await networkService.getMinimumAuctionTopUp();

      expect(minimumAuctionTopUp).toBeUndefined();
    });

    it("Should return undefined as minimum auction topup if no auctions", async () => {
      jest.spyOn(GatewayService.prototype, "getValidatorAuctions")
        .mockImplementation(jest.fn(() => Promise.resolve([])));

      const minimumAuctionTopUp = await networkService.getMinimumAuctionTopUp();

      expect(minimumAuctionTopUp).toBeUndefined();
    });
  });


  describe('getAbout', () => {
    it('should return API general information', async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      jest
        .spyOn(NetworkService.prototype, 'getAboutRaw')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => {
          return new About({
            appVersion: '8f2b49d',
            pluginsVersion: 'e0a77bc',
            network: 'mainnet',
            cluster: undefined,
          });
        }));

      const result = await networkService.getAbout();
      expect(result).toHaveStructure(Object.keys(new About()));
    });
  });

  describe('getAboutRaw', () => {
    it('should return mainnet API general configuration', async () => {
      jest.mock("child_process", () => {
        return {
          execSync: () => "8f2b49d",
        };
      });

      jest.spyOn(ApiConfigService.prototype, 'getNetwork')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => ('mainnet')));

      jest.spyOn(ApiConfigService.prototype, 'getCluster')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => undefined));

      const result = await networkService.getAboutRaw();

      expect(result.appVersion).toStrictEqual('8f2b49d');
      expect(result.network).toStrictEqual('mainnet');
      expect(result.cluster).toBeUndefined();
    });
  });
});
