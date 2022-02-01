import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { Identity } from "src/endpoints/identities/entities/identity";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe('Identities Service', () => {
  let identityService: IdentitiesService;
  let providerService: ProviderService;
  let apiConfigService: ApiConfigService;
  let identities: Identity[];
  let providers: Provider[];

  const ids: string[] = ['justminingfr', 'staking_agency', 'istari_vision'];
  const id: string = 'justminingfr';

  beforeAll(async () => {
    await Initializer.initialize();

    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    identityService = publicAppModule.get<IdentitiesService>(IdentitiesService);
    providerService = publicAppModule.get<ProviderService>(ProviderService);
    apiConfigService = publicAppModule.get<ApiConfigService>(ApiConfigService);

    identities = await identityService.getAllIdentities();
    providers = await providerService.getProvidersWithStakeInformation();
  }, Constants.oneHour() * 1000);

  describe('Identities', () => {
    it('all identities should have provider stake, topUp and locked', async () => {
      for (const identity of identities) {
        expect(identity).toHaveProperty('stake');
        expect(identity).toHaveProperty('topUp');
        expect(identity).toHaveProperty('locked');
      }
    });

    it('should be sorted by locked amount', async () => {
      let index = 1;

      while (index < identities.length) {
        expect(identities[index]).toBeDefined();
        expect(identities[index - 1]).toHaveProperty('locked');
        expect(identities[index]).toHaveProperty('locked');
        if (identities[index].locked < identities[index - 1].locked) {
          expect(false);
        }
        index++;
      }
    });

    it('should distribution sum be 1', async () => {
      for (const identity of identities) {
        if (identity.distribution) {
          const distributionValues = Object.values(identity.distribution).filter(x => x !== null);
          if (distributionValues.length > 0) {
            let sum = 0;
            for (const distribution of distributionValues) {
              sum += distribution;
            }

            expect(sum).toStrictEqual(1);
          }
        }
      }
    });

    it('some identities should be confirmed', async () => {
      expect(identities.length).toBeGreaterThanOrEqual(32);
    });

    it('all providers identities should appear', async () => {
      if (!apiConfigService.getMockNodes()) {
        for (const provider of providers) {
          if (provider.identity) {
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
      expect(results).toBeInstanceOf(Array);
    });
  });

  describe('Get Identities', () => {
    it('should return a list of identities based on ids', async () => {
      const results = await identityService.getIdentities(ids);
      expect(results).toBeInstanceOf(Array);
    });
  });

  describe('Get Identity', () => {
    it('should return a identity properties', async () => {
      const results = await identityService.getIdentity(id);
      expect(results).toBeInstanceOf(Object);
    });
  });
});
