import { Test } from '@nestjs/testing';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { CachingService } from 'src/common/caching/caching.service';
import { KeybaseState } from 'src/common/keybase/entities/keybase.state';
import { Provider } from 'src/endpoints/providers/entities/provider';
import { ProviderFilter } from 'src/endpoints/providers/entities/provider.filter';
import { ProviderService } from 'src/endpoints/providers/provider.service';
import { PublicAppModule } from 'src/public.app.module';
import { Constants } from 'src/utils/constants';
import providerAccount from '../mocks/accounts/provider.account';
import Initializer from './e2e-init';

describe('Provider Service', () => {
  let providerService: ProviderService;
  let cachingService: CachingService;
  let apiConfigService: ApiConfigService;
  let providers: Provider[];
  let identity: string;
  let providerSentinel: Provider;

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
    providerSentinel = providers[0];
  }, Constants.oneHour() * 1000);

  describe('Providers', () => {
    it('all providers should have provider address', async () => {
      for (const property of providers) {
        expect(property).toEqual({
          provider: property.provider,
          serviceFee: property.serviceFee,
          delegationCap: property.delegationCap,
          apr: property.apr,
          numUsers: property.numUsers,
          cumulatedRewards: property.cumulatedRewards,
          numNodes: property.numNodes,
          stake: property.stake,
          topUp: property.topUp,
          identity: property.identity,
          locked: property.locked,
          featured: property.featured,
          owner: property.owner,
        });
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
          const providerVIP = providers.find(
            ({ identity }) => identity === identityVIP,
          );

          expect(providerVIP?.provider).toStrictEqual(
            vipProviders[identityVIP],
          );
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
          if (
            providerKeybases[provider.provider] &&
            providerKeybases[provider.provider].confirmed
          ) {
            expect(provider.identity).toBe(
              providerKeybases[provider.provider].identity,
            );
          } else {
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
        } else {
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
      const provider = await providerService.getProvider(
        providerSentinel.provider,
      );
      expect(provider?.provider).toStrictEqual(providerSentinel.provider);
      expect(provider?.identity).toStrictEqual(providerSentinel.identity);
    });
  });

  describe('Get Delegation Providers', () => {
    it('all providers should have contract, featured, aprValue properties', async () => {
      const providerDelegation = await providerService.getDelegationProviders();

      for (const property of providerDelegation) {
        expect(property).toEqual(
          expect.objectContaining({
            aprValue: property.aprValue,
            featured: property.featured,
            contract: property.contract,
          }));
      }
    });
  });

  describe('Get Delegation Provider Raw', () => {
    it('should return delegation providers raw', async () => {
      const providerRaw = await providerService.getDelegationProvidersRaw();

      for (const property of providerRaw) {
        expect(property).toEqual(
          expect.objectContaining({
            aprValue: property.aprValue,
            featured: property.featured,
            contract: property.contract,
          }));
      }
    });
  });

  describe('Get All Providers', () => {
    it('should return all providers', async () => {
      const providers = await providerService.getAllProviders();

      for (const properties of providers) {
        expect(properties).toEqual({
          provider: properties.provider,
          serviceFee: properties.serviceFee,
          delegationCap: properties.delegationCap,
          apr: properties.apr,
          numUsers: properties.numUsers,
          cumulatedRewards: properties.cumulatedRewards,
          numNodes: properties.numNodes,
          stake: properties.stake,
          topUp: properties.topUp,
          identity: properties.identity,
          locked: properties.locked,
          featured: properties.featured,
          owner: properties.owner,
        });
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

      expect(provider).toEqual(
        expect.objectContaining({
          owner: provider.owner,
          serviceFee: provider.serviceFee,
          delegationCap: provider.delegationCap,
        }));
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

      expect(provider).toEqual(
        expect.objectContaining({
          name: provider.name,
          website: provider.website,
          identity: provider.identity,
        }));
    });
  });

  describe('Get Provider With Stake Information Raw', () => {
    it('should return provider information with stake', async () => {
      const properties = await providerService.getProvidersWithStakeInformationRaw();

      for (const property of properties) {
        expect(property).toEqual({
          provider: property.provider,
          serviceFee: property.serviceFee,
          delegationCap: property.delegationCap,
          apr: property.apr,
          numUsers: property.numUsers,
          cumulatedRewards: property.cumulatedRewards,
          numNodes: property.numNodes,
          stake: property.stake,
          topUp: property.topUp,
          identity: property.identity,
          locked: property.locked,
          featured: property.featured,
        });
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
        expect(provider).toEqual({
          provider: provider.provider,
          serviceFee: provider.serviceFee,
          delegationCap: provider.delegationCap,
          apr: provider.apr,
          numUsers: provider.numUsers,
          cumulatedRewards: provider.cumulatedRewards,
          identity: provider.identity,
          numNodes: provider.numNodes,
          stake: provider.stake,
          topUp: provider.topUp,
          locked: provider.locked,
          featured: provider.featured,
        }
        );
      }
    });
  });

  describe('Get Provider Addresses', () => {
    it('should return provider address', async () => {
      const providerAddress = await providerService.getProviderAddresses();

      expect(providerAddress).toEqual(
        expect.arrayContaining([expect.any(String)]),
      );
    });
  });
});
