import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api.config.service";
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

  beforeAll(async () => {
    await Initializer.initialize();
  }, Constants.oneHour() * 1000);

  beforeEach(async () => {
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    identityService = publicAppModule.get<IdentitiesService>(IdentitiesService);
    providerService = publicAppModule.get<ProviderService>(ProviderService);
    apiConfigService = publicAppModule.get<ApiConfigService>(ApiConfigService);
    identities = await identityService.getAllIdentities();
    providers = await providerService.getAllProviders();
  });

  describe('Identities', () => {
    it('all identities should have provider stake, topUp and locked', async () => {
      for (let identity of identities) {
        expect(identity).toHaveProperty('stake');
        expect(identity).toHaveProperty('topUp');
        expect(identity).toHaveProperty('locked');
      }
    });

    it('should be sorted by locked amount', async () => {
      let index = 1;

      while (index < identities.length) {
        expect(identities[index]).toBeDefined();
        expect(identities[index-1]).toHaveProperty('locked');
        expect(identities[index]).toHaveProperty('locked');
        if (identities[index].locked < identities[index-1].locked) {
          expect(false);
        }
        index ++;
      }
    });

    it('should distribution sum be 1', async () => {
      for (let identity of identities) {
        if (identity.distribution) {
          let sum = 0;
          for (let distribution of Object.values(identity.distribution)) {
            sum += distribution;
          }

          expect(sum).toStrictEqual(1);
        }
      }
    });

    it('some identities should be confirmed', async () => {
      expect(identities.length).toBeGreaterThanOrEqual(32);
    });

    it('all providers identities should appear', async () => {
      if (!apiConfigService.getMockNodes()) {
        for (let provider of providers) {
          if (provider.identity) {
            const providerIdentity = identities.find(({ identity }) => identity === provider.identity);
  
            expect(providerIdentity).toBeDefined();
            expect(providerIdentity).toHaveProperty('locked');
            expect(providerIdentity).toHaveProperty('name');
          }
        }
      }
    });
  });
});