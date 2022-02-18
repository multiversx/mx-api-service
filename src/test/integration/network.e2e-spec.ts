import { Test } from "@nestjs/testing";
import { NetworkService } from "../../endpoints/network/network.service";
import { NetworkConstants } from "src/endpoints/network/entities/constants";
import { NetworkConfig } from "src/endpoints/network/entities/network.config";
import { Economics } from "src/endpoints/network/entities/economics";
import { NetworkModule } from "src/endpoints/network/network.module";
import '../../utils/extensions/jest.extensions';
import '../../utils/extensions/array.extensions';
import '../../utils/extensions/number.extensions';

describe('Network Service', () => {
  let networkService: NetworkService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NetworkModule],
    }).compile();

    networkService = moduleRef.get<NetworkService>(NetworkService);
  });

  describe('Get Constants', () => {
    it('should return network constants', async () => {
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
      const propertiesRaw = await networkService.getEconomicsRaw();
      expect(propertiesRaw).toHaveStructure(Object.keys(new Economics()));
    });
  });

  describe('Get Economics', () => {
    it('should return economics properties', async () => {
      const properties = await networkService.getEconomics();
      expect(properties).toBeInstanceOf(Object);
    });
  });
});
