import { CachingService } from 'src/common/caching/caching.service';
import { Test } from "@nestjs/testing";
import { NetworkService } from "../../endpoints/network/network.service";
import { NetworkConstants } from "src/endpoints/network/entities/constants";
import { NetworkConfig } from "src/endpoints/network/entities/network.config";
import { Economics } from "src/endpoints/network/entities/economics";
import '../../utils/extensions/jest.extensions';
import '../../utils/extensions/array.extensions';
import '../../utils/extensions/number.extensions';
import { PublicAppModule } from "src/public.app.module";
import { Stats } from 'src/endpoints/network/entities/stats';

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
});
