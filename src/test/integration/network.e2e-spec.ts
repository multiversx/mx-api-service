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
      const returnConstants = await networkService.getConstants();
      expect(returnConstants).toBeInstanceOf(Object);
    });
    it('verify if return vale contain properties', async () => {
      const returnConstants = await networkService.getConstants();
      expect(returnConstants).toHaveProperty('chainId');
      expect(returnConstants).toHaveProperty('gasPerDataByte');
      expect(returnConstants).toHaveProperty('minGasLimit');
      expect(returnConstants).toHaveProperty('minGasPrice');
      expect(returnConstants).toHaveProperty('minTransactionVersion');
    });
  });

  describe('Get Network Config', () => {
    it('should return network configuration', async () => {
      const returnNetworkConfig = await networkService.getNetworkConfig();
      expect(returnNetworkConfig).toBeInstanceOf(Object);
    });
    it('verify if return value contain properties', async () => {
      const returnNetworkConfig = await networkService.getNetworkConfig();
      expect(returnNetworkConfig).toHaveProperty('roundsPassed');
      expect(returnNetworkConfig).toHaveProperty('roundsPerEpoch');
      expect(returnNetworkConfig).toHaveProperty('roundDuration');
    });
  });
  describe('Get Economics Raw', () => {
    it('should return economic raw properties', async () => {
      const returnEconomicsRaw = await networkService.getEconomicsRaw();
      expect(returnEconomicsRaw).toBeInstanceOf(Object);
    });
    it('verify if return value contain properties', async () => {
      const returnEconomicsRaw = await networkService.getEconomicsRaw();
      expect(returnEconomicsRaw).toHaveProperty('totalSupply');
      expect(returnEconomicsRaw).toHaveProperty('circulatingSupply');
      expect(returnEconomicsRaw).toHaveProperty('staked');
      expect(returnEconomicsRaw).toHaveProperty('price');
      expect(returnEconomicsRaw).toHaveProperty('marketCap');
      expect(returnEconomicsRaw).toHaveProperty('apr');
      expect(returnEconomicsRaw).toHaveProperty('topUpApr');
      expect(returnEconomicsRaw).toHaveProperty('baseApr');
    });
  });
  describe('Get Economics', () => {
    it('should return economics properties', async () => {
      const returnEconomics = await networkService.getEconomics();
      expect(returnEconomics).toBeInstanceOf(Object);
    });
    it('verify if return value contain properties', async () => {
      const returnEconomics = await networkService.getEconomics();
      expect(returnEconomics).toHaveProperty('totalSupply');
      expect(returnEconomics).toHaveProperty('circulatingSupply');
      //  expect(returnEconomics).toHaveProperty('marketCap');
      expect(returnEconomics).toHaveProperty('apr');
      expect(returnEconomics).toHaveProperty('baseApr');
      expect(returnEconomics).toHaveProperty('staked');
      expect(returnEconomics).toHaveProperty('topUpApr');
      //  expect(returnEconomics).toHaveProperty('price');


    });
  });
});