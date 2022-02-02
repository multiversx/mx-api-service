import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { KeybaseState } from "src/common/keybase/entities/keybase.state";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderFilter } from "src/endpoints/providers/entities/provider.filter";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe('Provider Service', () => {
  let providerService: ProviderService;
  let cachingService: CachingService;
  let apiConfigService: ApiConfigService;
  let providers: Provider[];
  let identity: string;
  let providerSentinel: Provider;

  const providerAddress: string = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85';


  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    providerService = publicAppModule.get<ProviderService>(ProviderService);
    apiConfigService = publicAppModule.get<ApiConfigService>(ApiConfigService);
    cachingService = publicAppModule.get<CachingService>(CachingService);

    providers = await providerService.getProviders(new ProviderFilter());
    identity = "istari_vision";
    providerSentinel = providers[0];

  }, Constants.oneHour() * 1000);

  describe('Providers', () => {
    it('all providers should have provider address', async () => {
      for (const provider of providers) {
        expect(provider).toHaveProperty('provider');
      }
    });

    it('all providers should have nodes', async () => {
      for (const provider of providers) {
        expect(provider.numNodes).toBeGreaterThan(0);
      }
    });

    it('providers with more than 30 nodes should have identity', async () => {
      for (const provider of providers) {
        if (provider.numNodes >= 30) {
          expect(provider).toHaveProperty('identity');
        }
      }
    });

    it('some providers should be included', async () => {
      if (!apiConfigService.getMockNodes()) {
        const vipProviders: { [key: string]: string } = {
          staking_agency: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat',
          istari_vision: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqrhlllls062tu4',
          truststaking: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzhllllsp9wvyl',
          partnerstaking: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q',
          justminingfr: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85',
          thepalmtreenw: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5',
          arcstake: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqz8llllsh6u4jp',
          primalblock: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqx8llllsxavffq',
          everstake: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq28llllsu54ydr',
          heliosstaking: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqx0llllsdx93z0',
          mgstaking: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9lllllsf3mp40',
          unitedgroup: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllllls27850s',
          empress_genmei: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg8llllsqra25h',
          stakeborg: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqfhllllscrt56r',
          validblocks: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq90llllslwfcr3',
          middlestakingfr: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqyhllllsv4k7x2',
          binance_staking: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu',
          forbole: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq40llllsfjmn54',
        };

        for (const identityVIP of Object.keys(vipProviders)) {
          const providerVIP = providers.find(({ identity }) => identity === identityVIP);

          expect(providerVIP?.provider).toStrictEqual(vipProviders[identityVIP]);
          expect(providerVIP?.identity).toStrictEqual(identityVIP);
          expect(providerVIP).toHaveProperty('locked');
        }
      }
    });

    it('should be in sync with keybase confirmations', async () => {
      const providerKeybases: { [key: string]: KeybaseState } | undefined = await cachingService.getCache('providerKeybases');
      expect(providerKeybases).toBeDefined();

      for (const provider of providers) {
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
        expect(providers[index - 1]).toHaveProperty('locked');
        expect(providers[index]).toHaveProperty('locked');
        if (providers[index].locked >= providers[index - 1].locked) {
          expect(true);
        }
        else {
          expect(false);
        }
        index++;
      }
    });

    it('should be filtered by identity', async () => {
      const providersFilter = new ProviderFilter();
      providersFilter.identity = identity;
      const providers = await providerService.getProviders(providersFilter);

      for (const provider of providers) {
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
  
  describe('Get Delegation Providers', () => {
    it('should return delegation providers', async () => {
      const providerDelegation = await providerService.getDelegationProviders();
      expect(providerDelegation).toBeInstanceOf(Object);
    });
    it('all providers should have contract, featured, aprValue properties', async () => {
      const providerDelegation = await providerService.getDelegationProviders();

      for (const provider of providerDelegation) {
        expect(provider).toHaveProperty('contract');
        expect(provider).toHaveProperty('featured');
        expect(provider).toHaveProperty('aprValue');
      }
    });
  });

  describe('Get Delegation Provider Raw', () => {
    it('should return delegation providers raw', async () => {
      expect.assertions(1);
      try {
        const providerRaw = await providerService.getDelegationProvidersRaw();
        expect(providerRaw).toBeInstanceOf(Object);
      } catch (error) {
        expect(error).toMatch('Error when getting delegation providers');
      }
    });
  });

  describe('Get All Providers', () => {
    it('should return all providers', async () => {
      const providers = await providerService.getAllProviders();

      for (const provider of providers) {
        expect(provider).toBeInstanceOf(Object);
      }
    });
  });

  describe('Get All Providers Raw', () => {
    it('should return all providers raw', async () => {
      const providersRaw = await providerService.getAllProvidersRaw();

      for (const providerRaw of providersRaw) {
        expect(providerRaw).toBeInstanceOf(Object);
      }
    });
  });

  describe('Get Provider Configuration', () => {
    it('should return provider configuration', async () => {
      const providerConfig = await providerService.getProviderConfig(providerAddress);
      expect(providerConfig).toBeInstanceOf(Object);
    });
    it('provider configuration must contain owner, serviceFee, delegationCap and apr', async () => {
      const providerConfig = await providerService.getProviderConfig(providerAddress);
      expect(providerConfig).toHaveProperty('owner');
      expect(providerConfig).toHaveProperty('serviceFee');
      expect(providerConfig).toHaveProperty('delegationCap');
      expect(providerConfig).toHaveProperty('apr');
    });
  });

  describe('Get Number of users', () => {
    it('should return the numbers of users', async () => {
      const users = await providerService.getNumUsers(providerAddress);
      expect(typeof users).toBe('number');
    });
  });

  describe('Get Cumulated Rewards', () => {
    it('should return cumulated reward from provider address', async () => {
      const rewards =  await providerService.getCumulatedRewards(providerAddress);
      expect(typeof rewards).toBe('string');
    });
  });

  describe('Get Provider Metadata', () => {
    it('should return provider metadata', async () => {
      const providerMeta = await providerService.getProviderMetadata(providerAddress);
      expect(providerMeta).toBeInstanceOf(Object);
    });
    it('provider metadata must contain "name", "website", "identity ', async () => {
      const providerMeta = await providerService.getProviderMetadata(providerAddress);
      expect(providerMeta).toHaveProperty('name');
      expect(providerMeta).toHaveProperty('website');
      expect(providerMeta).toHaveProperty('identity');
    });
  });

  describe('Get Provider With Stake Information Raw', () => {
    it('should return provider information with stake', async () => {
      const stakeProvider = await providerService.getProvidersWithStakeInformationRaw();

      for (const provider of stakeProvider) {
        expect(provider).toBeInstanceOf(Object);
      }
    });
    it('all providers with stake should have provider address', async () => {
      const stakeProvider = await providerService.getProvidersWithStakeInformationRaw();
      for (const provider of stakeProvider)
        expect(provider).toHaveProperty('provider');
    });
    it('all providers with stake should have nodes', async () => {
      const stakeProvider = await providerService.getProvidersWithStakeInformationRaw();
      for (const provider of stakeProvider) {
        expect(provider.numNodes).toBeGreaterThan(0);
      }
    });
    it('providers with more than 30 nodes should have identity', async () => {
      const stakeProvider = await providerService.getProvidersWithStakeInformationRaw();
      for (const provider of stakeProvider) {
        if (provider.numNodes >= 30) {
          expect(provider).toHaveProperty('identity');
        }
      }
    });
  });

  describe('Get Provider With Stake Information', () => {
    it('should return providers with stake informations', async () => {
      const providers = await providerService.getProvidersWithStakeInformation();

      for (const provider of providers) {
        expect(provider).toBeInstanceOf(Object);
      }
    });
  });

  describe('Get Provider Addresses', () => {
    it('should return provider address', async () => {
      try {
        const providerAddress = await providerService.getProviderAddresses();
        expect(providerAddress).toEqual(expect.arrayContaining([expect.any(String)]));
      } catch (error) {
        expect(error).toMatch('error');
      }
    });
  });
});
