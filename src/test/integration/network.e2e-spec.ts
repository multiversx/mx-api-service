import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { NetworkService } from "../../endpoints/network/network.service";

describe('Network Service', () => {
  let networkService: NetworkService;

  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    networkService = publicAppModule.get<NetworkService>(NetworkService);

  }, Constants.oneHour() * 1000);

  describe('Get Constants', () => {
    it('should return network constants', async () => {
      const constants = await networkService.getConstants();
      expect(constants).toBeInstanceOf(Object);
    });
    it('verify if return value contain properties', async () => {
      const constants = await networkService.getConstants();
      expect(constants).toHaveProperty('chainId');
      expect(constants).toHaveProperty('gasPerDataByte');
      expect(constants).toHaveProperty('minGasLimit');
      expect(constants).toHaveProperty('minGasPrice');
      expect(constants).toHaveProperty('minTransactionVersion');
    });
  });

  describe('Get Network Config', () => {
    it('should return network configuration', async () => {
      const networkConfig = await networkService.getNetworkConfig();
      expect(networkConfig).toBeInstanceOf(Object);
    });
    it('verify if return value contain properties', async () => {
      const networkConfig = await networkService.getNetworkConfig();
      expect(networkConfig).toHaveProperty('roundsPassed');
      expect(networkConfig).toHaveProperty('roundsPerEpoch');
      expect(networkConfig).toHaveProperty('roundDuration');
    });
  });
  describe('Get Economics Raw', () => {
    it('should return economic raw properties', async () => {
      const economicsRaw = await networkService.getEconomicsRaw();
      expect(economicsRaw).toBeInstanceOf(Object);
    });
    it('verify if return value contain properties', async () => {
      const economicsRaw = await networkService.getEconomicsRaw();
      expect(economicsRaw).toHaveProperty('totalSupply');
      expect(economicsRaw).toHaveProperty('circulatingSupply');
      expect(economicsRaw).toHaveProperty('staked');
      expect(economicsRaw).toHaveProperty('price');
      expect(economicsRaw).toHaveProperty('marketCap');
      expect(economicsRaw).toHaveProperty('apr');
      expect(economicsRaw).toHaveProperty('topUpApr');
      expect(economicsRaw).toHaveProperty('baseApr');
    });
  });
  describe('Get Economics', () => {
    it('should return economics properties', async () => {
      const economics = await networkService.getEconomics();
      expect(economics).toBeInstanceOf(Object);
    });
    it('verify if return value contain properties', async () => {
      const economics = await networkService.getEconomics();
      expect(economics).toHaveProperty('totalSupply');
      expect(economics).toHaveProperty('circulatingSupply');
      expect(economics).toHaveProperty('apr');
      expect(economics).toHaveProperty('baseApr');
      expect(economics).toHaveProperty('staked');
      expect(economics).toHaveProperty('topUpApr');
    });
  });
});