import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { Identity } from "src/endpoints/identities/entities/identity";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderService } from "src/endpoints/providers/provider.service";
import '@elrondnetwork/erdnest-common/lib/src/utils/extensions/jest.extensions';
import '@elrondnetwork/erdnest-common/lib/src/utils/extensions/array.extensions';
import '@elrondnetwork/erdnest-common/lib/src/utils/extensions/number.extensions';
import { PublicAppModule } from "src/public.app.module";

describe('Identities Service', () => {
  let identityService: IdentitiesService;
  let providerService: ProviderService;
  let apiConfigService: ApiConfigService;
  let identities: Identity[];
  let providers: Provider[];

  const ids: string[] = ['justminingfr', 'staking_agency', 'istari_vision'];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    identityService = moduleRef.get<IdentitiesService>(IdentitiesService);
    providerService = moduleRef.get<ProviderService>(ProviderService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

    identities = await identityService.getAllIdentities();
    providers = await providerService.getProvidersWithStakeInformation();
  });

  describe('Identities', () => {
    it('all identities should have provider stake, topUp and locked', () => {
      for (const identity of identities) {
        expect(identity).toHaveProperty('stake');
        expect(identity).toHaveProperty('topUp');
        expect(identity).toHaveProperty('locked');
      }
    });

    it('should be sorted by locked amount', () => {
      for (let index = 1; index < identities.length; index++) {
        const currentIdentity = identities[index];
        const previousIdentity = identities[index - 1];

        expect(currentIdentity).toBeDefined();
        expect(previousIdentity).toHaveProperty('locked');
        expect(currentIdentity).toHaveProperty('locked');

        if (Number(currentIdentity.locked) > Number(previousIdentity.locked)) {
          throw new Error(`Invalid sorting by locked for current identity '${currentIdentity.identity ?? currentIdentity.name}' and previous identity '${previousIdentity.identity ?? previousIdentity.name}'`);
        }
      }
    });

    it('should distribution sum be 1', () => {
      for (const identity of identities) {
        if (identity.distribution) {
          const distributionValues = Object.values(identity.distribution).filter(x => x !== null);
          if (distributionValues.length > 0) {
            const sum = distributionValues.sum();

            expect(sum).toStrictEqual(1);
          }
        }
      }
    });

    it('some identities should be confirmed', () => {
      expect(identities.length).toBeGreaterThanOrEqual(32);
    });

    it('all providers identities should appear', () => {
      if (!apiConfigService.getMockNodes()) {
        for (const provider of providers) {
          if (provider.identity && provider.locked !== '0') {
            const providerIdentity = identities.find(({ identity }) => identity === provider.identity);

            expect(providerIdentity?.identity).toStrictEqual(provider.identity);
            expect(providerIdentity).toHaveProperty('locked');
            expect(providerIdentity).toHaveProperty('name');
          }
        }
      }
    });
  });

  describe('Get All Identities Raw', () => {
    it('should return all identities raw', async () => {
      const results = await identityService.getAllIdentitiesRaw();

      for (const result of results) {
        expect(result).toBeInstanceOf(Object);
      }
    });
  });

  describe('Get Identities', () => {
    it('should return a list of identities based on ids', async () => {
      const results = await identityService.getIdentities(ids);

      for (const result of results) {
        expect(result).toHaveProperties([
          'apr', 'avatar', 'description',
          'distribution', 'identity', 'location',
          'locked', 'name', 'providers',
          'rank', 'score', 'stake',
          'stakePercent', 'topUp', 'validators', 'website',
        ]);
      }
    });
  });
});
