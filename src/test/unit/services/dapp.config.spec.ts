import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { DappConfigService } from 'src/endpoints/dapp-config/dapp.config.service';
import { DappConfig } from 'src/endpoints/dapp-config/entities/dapp-config';

describe('Dapp Config Service', () => {
  let dappConfigService: DappConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    dappConfigService = moduleRef.get<DappConfigService>(DappConfigService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe("getDappConfiguration", () => {
    it("should return mainnet dapp configuration", () => {
      jest
        .spyOn(ApiConfigService.prototype, 'getNetwork')
        .mockImplementation(jest.fn(() => 'mainnet'));

      const config = dappConfigService.getDappConfiguration();

      if (!config) {
        throw new Error('Properties are not defined');
      }

      expect(config.id).toStrictEqual('mainnet');
      expect(config.name).toStrictEqual('Mainnet');
      expect(config.chainId).toStrictEqual('1');
    });

    it("should return devnet dapp configuration", () => {
      jest
        .spyOn(DappConfigService.prototype, 'getDappConfigurationRaw')
        .mockImplementation(jest.fn(() => new DappConfig({
          "id": "devnet",
          "name": "Devnet",
          "egldLabel": "xEGLD",
          "decimals": "4",
          "egldDenomination": "18",
          "gasPerDataByte": "1500",
          "apiTimeout": "4000",
          "walletConnectDeepLink": "https://maiar.page.link/?apn=com.multiversx.maiar.wallet&isi=1519405832&ibi=com.multiversx.maiar.wallet&link=https://maiar.com/",
          "walletAddress": "https://devnet-wallet.multiversx.com",
          "apiAddress": "https://devnet-api.multiversx.com",
          "explorerAddress": "http://devnet-explorer.multiversx.com",
          "chainId": "D",
        })));

      const config = dappConfigService.getDappConfiguration();

      if (!config) {
        throw new Error('Properties are not defined');
      }
    });

    it("should return devnet2 dapp configuration", () => {
      jest
        .spyOn(DappConfigService.prototype, 'getDappConfigurationRaw')
        .mockImplementation(jest.fn(() => new DappConfig({
          "id": "devnet2",
          "name": "Devnet",
          "egldLabel": "xEGLD",
          "decimals": "4",
          "egldDenomination": "18",
          "gasPerDataByte": "1500",
          "apiTimeout": "4000",
          "walletConnectDeepLink": "https://maiar.page.link/?apn=com.multiversx.maiar.wallet&isi=1519405832&ibi=com.multiversx.maiar.wallet&link=https://maiar.com/",
          "walletAddress": "https://devnet2-wallet.multiversx.com",
          "apiAddress": "https://devnet2-api.multiversx.com",
          "explorerAddress": "http://devnet2-explorer.multiversx.com",
          "chainId": "D",
        })));

      const config = dappConfigService.getDappConfiguration();

      if (!config) {
        throw new Error('Properties are not defined');
      }
    });
  });
});
