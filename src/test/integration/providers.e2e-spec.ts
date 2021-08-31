import { Test } from "@nestjs/testing";
import { CachingService } from "src/common/caching.service";
import { KeybaseState } from "src/common/entities/keybase.state";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderFilter } from "src/endpoints/providers/entities/provider.filter";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe('Provider Service', () => {
  let providerService: ProviderService;
  let cachingService: CachingService;
  let providers: Provider[];
  let identity: string;
  let providerSentinel: Provider;

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
    identity = "istari_vision";
    providerSentinel = providers[0];
  });

  describe('Providers', () => {
    it('all providers should have provider address', async () => {
      for (let provider of providers) {
        expect(provider).toHaveProperty('provider');
      }
    });
    
    it('all entities should have provider structure', async () => {
      for (let provider of providers) {
        expect(provider).toHaveStructure(Object.keys(new Provider()));
      }
    });

    it('should be in sync with keybase confirmations', async () => {
      const providerKeybases:{ [key: string]: KeybaseState } | undefined = await cachingService.getCache('providerKeybases');
      expect(providerKeybases).toBeDefined();

      for (let provider of providers) {
        if (providerKeybases) {
          if (providerKeybases[provider.provider] && providerKeybases[provider.provider].confirmed) {
            expect(provider.identity).toBe(providerKeybases[provider.provider].identity);
          }
          else {
            expect(provider.identity).toBeUndefined();
          }
        }
      }
    });

    it('should be sorted by locked amount', async () => {
      let index = 1;

      while (index < providers.length) {
        expect(providers[index-1]).toHaveProperty('locked');
        expect(providers[index]).toHaveProperty('locked');
        expect(BigInt(providers[index].locked)).toBeGreaterThanOrEqual(BigInt(providers[index-1].locked));
        index ++;
      }
    });

    it('should be filtered by identity', async () => {
      const providersFilter = new ProviderFilter();
      providersFilter.identity = identity;
      const identityProviders = await providerService.getProviders(providersFilter);

      for (let provider of identityProviders) {
        expect(provider.identity).toStrictEqual(identity);
      }
    });

    it('some providers should be confirmed', async () => {
      expect(providers.length).toBeGreaterThanOrEqual(32);
    });

    it('should be filtered by provider address', async () => {
      const provider = await providerService.getProvider(providerSentinel.provider);
      expect(provider?.provider).toStrictEqual(providerSentinel.provider);
      expect(provider?.identity).toStrictEqual(providerSentinel.identity);
    });
  });
});