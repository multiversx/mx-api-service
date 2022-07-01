import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { DappConfigService } from '../../endpoints/dapp-config/dapp.config.service';
import Initializer from './e2e-init';
import { Constants } from '@elrondnetwork/erdnest';

describe('Dapp Config Service', () => {
  let dappConfigService: DappConfigService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    dappConfigService = moduleRef.get<DappConfigService>(DappConfigService);

  }, Constants.oneHour() * 1000);

  beforeEach(() => { jest.restoreAllMocks(); });

  describe("getDappConfiguration", () => {
    it("should return mainnet dapp configuration", () => {
      jest
        .spyOn(ApiConfigService.prototype, 'getNetwork')
        .mockImplementation(jest.fn(() => 'mainnet'));

      const config = dappConfigService.getDappConfiguration();

      expect(config.id).toStrictEqual('mainnet');
      expect(config.name).toStrictEqual('Mainnet');
      expect(config.chainId).toStrictEqual('1');
    });

    it("should return devnet dapp configuration", () => {
      jest
        .spyOn(ApiConfigService.prototype, 'getNetwork')
        .mockImplementation(jest.fn(() => 'devnet'));

      const config = dappConfigService.getDappConfiguration();

      expect(config.id).toStrictEqual('devnet');
      expect(config.name).toStrictEqual('Devnet');
      expect(config.chainId).toStrictEqual('D');
    });

    it("should return testnet dapp configuration", () => {
      jest
        .spyOn(ApiConfigService.prototype, 'getNetwork')
        .mockImplementation(jest.fn(() => 'testnet'));

      const config = dappConfigService.getDappConfiguration();

      expect(config.id).toStrictEqual('testnet');
      expect(config.name).toStrictEqual('Testnet');
      expect(config.chainId).toStrictEqual('T');
    });
  });
});
