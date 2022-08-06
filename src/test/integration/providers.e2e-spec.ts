import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { ProviderFilter } from 'src/endpoints/providers/entities/provider.filter';
import { Test } from '@nestjs/testing';
import { ProviderService } from 'src/endpoints/providers/provider.service';
import { PublicAppModule } from 'src/public.app.module';
import { ProviderConfig } from '../../endpoints/providers/entities/provider.config';
import { Provider } from 'src/endpoints/providers/entities/provider';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/array.extensions';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/jest.extensions';
import { CachingService } from '@elrondnetwork/erdnest';

describe('Provider Service', () => {
  let providerService: ProviderService;
  let apiConfigService: ApiConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    jest
      .spyOn(CachingService.prototype, 'getOrSetCache')
      // eslint-disable-next-line require-await
      .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

    providerService = moduleRef.get<ProviderService>(ProviderService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe("Get Provider", () => {
    it("should return provider based on address", async () => {
      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";

      const result = await providerService.getProvider(address);

      if (!result) {
        throw new Error("Properties are not defined");
      }

      expect(result.hasOwnProperty("provider")).toBeTruthy();
      expect(result.hasOwnProperty("serviceFee")).toBeTruthy();
      expect(result.hasOwnProperty("delegationCap")).toBeTruthy();
      expect(result.hasOwnProperty("apr")).toBeTruthy();
      expect(result.hasOwnProperty("numUsers")).toBeTruthy();
      expect(result.hasOwnProperty("cumulatedRewards")).toBeTruthy();
      expect(result.hasOwnProperty("identity")).toBeTruthy();
      expect(result.hasOwnProperty("numNodes")).toBeTruthy();
      expect(result.hasOwnProperty("stake")).toBeTruthy();
      expect(result.hasOwnProperty("topUp")).toBeTruthy();
      expect(result.hasOwnProperty("locked")).toBeTruthy();
      expect(result.hasOwnProperty("featured")).toBeTruthy();
    });

    it("should verify if identity of provider is defined", async () => {
      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const result = await providerService.getProvider(address);

      if (!result) {
        throw new Error("Properties are not defined");
      }

      expect(result.identity).toBeDefined();
      expect(result.identity).toStrictEqual("justminingfr");
      expect(result.provider).toStrictEqual("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85");
    });

    it("should return provider addresses", async () => {
      const results = await providerService.getProviderAddresses();

      expect(results.length).toBeGreaterThan(50);
    });

    it("should return provider configuration", async () => {
      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const results = await providerService.getProviderConfig(address);

      expect(results).toHaveStructure(Object.keys(new ProviderConfig()));
    });

    it("should return providerd metadata", async () => {
      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const results = await providerService.getProviderMetadata(address);

      expect(results.hasOwnProperty("name")).toBeTruthy();
      expect(results.hasOwnProperty("website")).toBeTruthy();
      expect(results.hasOwnProperty("identity")).toBeTruthy();
    });

    it("should return numbers of users for a specific provider", async () => {
      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const results = await providerService.getNumUsers(address);

      expect(typeof results).toStrictEqual("number");
    });

    it("should return cumulated rewards for a specific provider", async () => {
      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const results = await providerService.getCumulatedRewards(address);

      expect(typeof results).toStrictEqual("string");

    });
  });

  describe("Get Providers", () => {
    it("should return all providers", async () => {
      const results = await providerService.getAllProviders();

      for (const result of results) {
        expect(result.hasOwnProperty("provider")).toBeTruthy();
        expect(result.hasOwnProperty("serviceFee")).toBeTruthy();
        expect(result.hasOwnProperty("delegationCap")).toBeTruthy();
        expect(result.hasOwnProperty("apr")).toBeTruthy();
        expect(result.hasOwnProperty("numUsers")).toBeTruthy();
        expect(result.hasOwnProperty("cumulatedRewards")).toBeTruthy();
        expect(result.hasOwnProperty("numNodes")).toBeTruthy();
        expect(result.hasOwnProperty("stake")).toBeTruthy();
        expect(result.hasOwnProperty("topUp")).toBeTruthy();
        expect(result.hasOwnProperty("locked")).toBeTruthy();
        expect(result.hasOwnProperty("featured")).toBeTruthy();
      }
    });

    it('should return all providers raw', async () => {
      const results = await providerService.getAllProvidersRaw();

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new Provider()));
      }
    });

    it("should return provider details", async () => {
      const filter = new ProviderFilter();
      const results = await providerService.getProviders(filter);

      for (const result of results) {
        expect(result.hasOwnProperty("provider")).toBeTruthy();
        expect(result.hasOwnProperty("serviceFee")).toBeTruthy();
        expect(result.hasOwnProperty("delegationCap")).toBeTruthy();
        expect(result.hasOwnProperty("apr")).toBeTruthy();
        expect(result.hasOwnProperty("numUsers")).toBeTruthy();
        expect(result.hasOwnProperty("cumulatedRewards")).toBeTruthy();
        expect(result.hasOwnProperty("numNodes")).toBeTruthy();
        expect(result.hasOwnProperty("stake")).toBeTruthy();
        expect(result.hasOwnProperty("topUp")).toBeTruthy();
        expect(result.hasOwnProperty("locked")).toBeTruthy();
        expect(result.hasOwnProperty("featured")).toBeTruthy();
      }
    });

    it("should be filtered by identity", async () => {
      const filter = new ProviderFilter();
      filter.identity = "justminingfr";
      const results = await providerService.getProviders(filter);

      for (const result of results) {
        expect(result.identity).toStrictEqual("justminingfr");
      }
    });

    it("should verify if providers contains minimum one node", async () => {
      const filter = new ProviderFilter();
      filter.identity = "justminingfr";

      const results = await providerService.getProviders(filter);

      for (const result of results) {
        expect(result.numNodes).toBeGreaterThan(0);
      }
    });

    it("should verify providers with more than 30 nodes should have identity", async () => {
      const filter = new ProviderFilter();
      const results = await providerService.getProviders(filter);

      for (const result of results) {
        if (result.numNodes > 30) {
          expect(result).toHaveProperty("identity");
        }
      }
    });

    it("should verify if provider contain idenity property", async () => {
      const filter = new ProviderFilter();
      filter.identity = "justminingfr";

      const results = await providerService.getProviders(filter);

      for (const result of results) {
        if (result.numNodes > 30) {
          expect(result.identity).toBeDefined();
          expect(result.identity).toStrictEqual("justminingfr");
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

        const providers = await providerService.getProviders(new ProviderFilter());

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

    it("should return providers with stake information", async () => {
      const results = await providerService.getProvidersWithStakeInformation();

      for (const result of results) {
        expect(result.stake).not.toBeUndefined();
      }
    });
  });
});
