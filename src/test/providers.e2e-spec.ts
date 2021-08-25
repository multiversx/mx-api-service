import { Test } from "@nestjs/testing";
import { CachingService } from "src/common/caching.service";
import { KeybaseState } from "src/common/entities/keybase.state";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import "../utils/extensions/jest.extensions";
import Initializer from "./e2e-init";

describe('Provider Service', () => {
  let providerService: ProviderService;
  let cachingService: CachingService;
  let providers: Provider[];

  beforeAll(async () => {
    await Initializer.initialize();
  }, Constants.oneHour() * 1000);

  beforeEach(async () => {
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    providerService = publicAppModule.get<ProviderService>(ProviderService);
    cachingService = publicAppModule.get<CachingService>(CachingService);
    providers = await providerService.getAllProviders();
    providers = providers.filter(x => x.identity);
  });

  describe('Providers', () => {
    it('all entities should have provider structure', async () => {
      for (let provider of providers) {
        expect(provider).toHaveStructure(Object.keys(new Provider()));
      }
    });

    it('should be in sync with keybase confirmations', async () => {
      const providerKeybases:{ [key: string]: KeybaseState } | undefined = await cachingService.getCache('providerKeybases');

      for (let provider of providers) {
        if (providerKeybases) {
          if (providerKeybases[provider.provider] && providerKeybases[provider.provider].confirmed) {
            expect(provider.identity).toBe(providerKeybases[provider.provider].identity);
          }
          else {
            expect(provider.identity).toBeUndefined();
          }
        }
        else {
          expect(false);
        }
      }
    });

    it('some providers should be confirmed', async () => {
      expect(providers.length).toBeGreaterThanOrEqual(32);
    });
  });
});