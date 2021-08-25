import { Test } from "@nestjs/testing";
import { CachingService } from "src/common/caching.service";
import { KeybaseState } from "src/common/entities/keybase.state";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { PublicAppModule } from "src/public.app.module";
import "../utils/extensions/jest.extensions";

describe('Provider Service', () => {
  let providerService: ProviderService;
  let cachingService: CachingService;
  let allProvidersRaw: Provider[];

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    providerService = moduleRef.get<ProviderService>(ProviderService);
    cachingService = moduleRef.get<CachingService>(CachingService);
    allProvidersRaw = await providerService.getAllProvidersRaw();
  });

  describe('Providers Raw', () => {
    it('all entities should have provider structure', async () => {
      for (let provider of allProvidersRaw) {
        expect(provider).toHaveStructure(Object.keys(new Provider()));
      }
    });

    it('should be in sync with keybase confirmations', async () => {
      const providerKeybases:{ [key: string]: KeybaseState } | undefined = await cachingService.getCache('providerKeybases');

      for (let provider of allProvidersRaw) {
        if (providerKeybases) {
          if (providerKeybases.provider.confirmed) {
            expect(provider.identity).toBe(providerKeybases.provider.identity);
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
      let numConfirmedProviders = 0;

      for (let provider of allProvidersRaw) {
        if (provider.identity) {
          numConfirmedProviders ++;
        }
      }

      expect(numConfirmedProviders).toBeGreaterThanOrEqual(32);
    });
  });
});