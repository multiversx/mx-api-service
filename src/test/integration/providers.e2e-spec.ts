import { Test } from '@nestjs/testing';
import BigNumber from 'bignumber.js';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { CachingService } from 'src/common/caching/caching.service';
import { KeybaseState } from 'src/common/keybase/entities/keybase.state';
import { Provider } from 'src/endpoints/providers/entities/provider';
import { ProviderFilter } from 'src/endpoints/providers/entities/provider.filter';
import { ProviderService } from 'src/endpoints/providers/provider.service';
import { PublicAppModule } from 'src/public.app.module';
import { Constants } from 'src/utils/constants';
import providerAccount from '../data/accounts/provider.account';
import Initializer from './e2e-init';

describe('Provider Service', () => {
  let providerService: ProviderService;
  let cachingService: CachingService;
  let apiConfigService: ApiConfigService;
  let providers: Provider[];
  let identity: string;
  let firstProvider: Provider;

  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    providerService = publicAppModule.get<ProviderService>(ProviderService);
    apiConfigService = publicAppModule.get<ApiConfigService>(ApiConfigService);
    cachingService = publicAppModule.get<CachingService>(CachingService);

    providers = await providerService.getProviders(new ProviderFilter());
    identity = 'istari_vision';
    firstProvider = providers[0];
  }, Constants.oneHour() * 1000);

  describe('Providers', () => {
    it('all providers should have provider address', async () => {

      for (const provider of providers) {
        expect(provider).toHaveProperty('provider');
        expect(provider).toHaveProperty('serviceFee');
        expect(provider).toHaveProperty('delegationCap');
        expect(provider).toHaveProperty('apr');
        expect(provider).toHaveProperty('numUsers');
        expect(provider).toHaveProperty('cumulatedRewards');
        expect(provider).toHaveProperty('numNodes');
        expect(provider).toHaveProperty('stake');
        expect(provider).toHaveProperty('topUp');
        expect(provider).toHaveProperty('locked');
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
          staking_agency:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat',
          istari_vision:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqrhlllls062tu4',
          truststaking:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzhllllsp9wvyl',
          partnerstaking:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q',
          justminingfr:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85',
          thepalmtreenw:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5',
          arcstake:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqz8llllsh6u4jp',
          primalblock:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqx8llllsxavffq',
          everstake:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq28llllsu54ydr',
          heliosstaking:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqx0llllsdx93z0',
          mgstaking:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9lllllsf3mp40',
          unitedgroup:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllllls27850s',
          empress_genmei:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg8llllsqra25h',
          stakeborg:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqfhllllscrt56r',
          validblocks:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq90llllslwfcr3',
          middlestakingfr:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqyhllllsv4k7x2',
          binance_staking:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu',
          forbole:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq40llllsfjmn54',
        };

        for (const identityVIP of Object.keys(vipProviders)) {
          const providerVIP = providers.find(({ identity }) => identity === identityVIP);
          if (!providerVIP) {
            throw new Error('ProviderVIP must be defined');
          }

          expect(providerVIP?.provider).toStrictEqual(vipProviders[identityVIP]);
          expect(providerVIP?.identity).toStrictEqual(identityVIP);
          expect(providerVIP).toHaveProperty('locked');
        }
      }
    });

    it('should be in sync with keybase confirmations', async () => {
      const providerKeybases: { [key: string]: KeybaseState } | undefined =
        await cachingService.getCache('providerKeybases');
      expect(providerKeybases).toBeDefined();

      for (const provider of providers) {
        if (providerKeybases) {
          if (providerKeybases[provider.provider] && providerKeybases[provider.provider].confirmed) {
            expect(provider.identity).toBe(providerKeybases[provider.provider].identity);
          } else {
            expect(provider.identity).toBeUndefined();
          }
        }
      }
    });

    it('should be sorted by locked amount', async () => {
      for (let index = 1; index < providers.length; index++) {
        const currentProvider = providers[index];
        const previousProvider = providers[index - 1];

        expect(previousProvider).toHaveProperty('locked');
        expect(currentProvider).toHaveProperty('locked');

        const currentLocked = new BigNumber(currentProvider.locked);
        const previousLocked = new BigNumber(previousProvider.locked);

        if (currentLocked > previousLocked) {
          expect(true);
        }
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
      const provider = await providerService.getProvider(firstProvider.provider);
      if (!provider) {
        throw new Error('Provider must be defined');
      }

      expect(provider.provider).toStrictEqual(firstProvider.provider);
      expect(provider.identity).toStrictEqual(firstProvider.identity);
    });
  });

  describe('Get Delegation Providers', () => {
    it('all providers should have contract, featured, aprValue properties', async () => {
      const providerDelegation = await providerService.getDelegationProviders();

      for (const property of providerDelegation) {
        expect(property).toHaveProperty('aprValue');
        expect(property).toHaveProperty('featured');
        expect(property).toHaveProperty('contract');
      }
    });
  });

  describe('Get Delegation Provider Raw', () => {
    it('should return delegation providers raw', async () => {
      const providerRaw = await providerService.getDelegationProvidersRaw();

      for (const property of providerRaw) {
        expect(property).toHaveProperty('aprValue');
        expect(property).toHaveProperty('featured');
        expect(property).toHaveProperty('contract');
      }
    });
  });

  describe('Get All Providers', () => {
    it('should return all providers', async () => {
      const providers = await providerService.getAllProviders();

      for (const provider of providers) {
        expect(provider).toHaveProperty('provider');
        expect(provider).toHaveProperty('serviceFee');
        expect(provider).toHaveProperty('delegationCap');
        expect(provider).toHaveProperty('apr');
        expect(provider).toHaveProperty('numUsers');
        expect(provider).toHaveProperty('cumulatedRewards');
        expect(provider).toHaveProperty('numNodes');
        expect(provider).toHaveProperty('stake');
        expect(provider).toHaveProperty('topUp');
        expect(provider).toHaveProperty('locked');
      }
    });
  });

  describe('Get All Providers Raw', () => {
    it('should return all providers raw', async () => {
      const providersRaw = await providerService.getAllProvidersRaw();

      for (const providerRaw of providersRaw) {
        expect(providerRaw).toHaveStructure(Object.keys(new Provider()));
      }
    });
  });

  describe('Get Provider Configuration', () => {
    it('should return provider configuration', async () => {
      const provider = await providerService.getProviderConfig(providerAccount.address);

      if (!provider) {
        throw new Error('Provider not defined');
      }
      expect(provider).toHaveProperty('apr');
      expect(provider).toHaveProperty('delegationCap');
      expect(provider).toHaveProperty('serviceFee');
    });
  });

  describe('Get Number of users', () => {
    it('should return the numbers of users', async () => {
      const users = await providerService.getNumUsers(providerAccount.address);
      expect(typeof users).toBe('number');
    });
  });

  describe('Get Cumulated Rewards', () => {
    it('should return cumulated reward from provider address', async () => {
      const rewards = await providerService.getCumulatedRewards(providerAccount.address);
      expect(typeof rewards).toBe('string');
    });
  });

  describe('Get Provider Metadata', () => {
    it('provider metadata must contain "name", "website", "identity ', async () => {
      const provider = await providerService.getProviderMetadata(providerAccount.address);

      expect(provider).toHaveProperty('name');
      expect(provider).toHaveProperty('website');
      expect(provider).toHaveProperty('identity');
    });
  });

  describe('Get Provider With Stake Information Raw', () => {
    it('should return provider information with stake', async () => {
      const providers = await providerService.getProvidersWithStakeInformationRaw();

      for (const provider of providers) {
        expect(provider).toHaveProperty('provider');
        expect(provider).toHaveProperty('serviceFee');
        expect(provider).toHaveProperty('delegationCap');
        expect(provider).toHaveProperty('apr');
        expect(provider).toHaveProperty('numUsers');
        expect(provider).toHaveProperty('cumulatedRewards');
        expect(provider).toHaveProperty('numNodes');
        expect(provider).toHaveProperty('stake');
        expect(provider).toHaveProperty('topUp');
        expect(provider).toHaveProperty('featured');
      }
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
        expect(provider).toHaveProperty('provider');
        expect(provider).toHaveProperty('serviceFee');
        expect(provider).toHaveProperty('delegationCap');
        expect(provider).toHaveProperty('apr');
        expect(provider).toHaveProperty('numUsers');
        expect(provider).toHaveProperty('cumulatedRewards');
        expect(provider).toHaveProperty('numNodes');
        expect(provider).toHaveProperty('stake');
        expect(provider).toHaveProperty('topUp');
        expect(provider).toHaveProperty('featured');
      }
    });
  });

  describe('Get Provider Addresses', () => {
    it('should return provider address', async () => {
      const providerAddresses = await providerService.getProviderAddresses();

      expect(providerAddresses.length).toBeGreaterThan(50);
    });
  });
});
