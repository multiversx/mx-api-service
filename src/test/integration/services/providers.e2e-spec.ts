import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { Test } from '@nestjs/testing';
import { ProviderService } from 'src/endpoints/providers/provider.service';
import { PublicAppModule } from 'src/public.app.module';
import { ProviderFilter } from 'src/endpoints/providers/entities/provider.filter';
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { ProviderConfig } from 'src/endpoints/providers/entities/provider.config';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/array.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/jest.extensions';

describe('Provider Service', () => {
  let providerService: ProviderService;
  let apiConfigService: ApiConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    jest
      .spyOn(CacheService.prototype, 'getOrSet')
      // eslint-disable-next-line require-await
      .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

    providerService = moduleRef.get<ProviderService>(ProviderService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe("Get Provider", () => {
    // skip temp 
    it.skip("should return provider based on address", async () => {
      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqz8llllsh6u4jp";

      const result = await providerService.getProvider(address);

      if (!result) {
        throw new Error("Properties are not defined");
      }

      expect(result.hasOwnProperty("provider")).toBeTruthy();
      expect(result.hasOwnProperty("owner")).toBeTruthy();
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
      expect(result.hasOwnProperty("automaticActivation")).toBeTruthy();
      expect(result.hasOwnProperty("initialOwnerFunds")).toBeTruthy();
      expect(result.hasOwnProperty("checkCapOnRedelegate")).toBeTruthy();
      expect(result.hasOwnProperty("totalUnStaked")).toBeTruthy();
    });

    it.skip("should verify if provider identity is defined", async () => {
      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqz8llllsh6u4jp";
      const result = await providerService.getProvider(address);

      if (!result) {
        throw new Error("Properties are not defined");
      }

      expect(result.identity).toBeDefined();
      expect(result.identity).toStrictEqual("arcstake");
      expect(result.provider).toStrictEqual("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqz8llllsh6u4jp");
      expect(result.owner).toStrictEqual("erd1g9gu7525zvaft6vtcwaj678flafmcgn9adws4ducls2zwvl0dmksr9u4nc");
      expect(result.automaticActivation).toStrictEqual(false);
      expect(result.initialOwnerFunds).toStrictEqual("1250000000000000000000");
      expect(result.checkCapOnRedelegate).toStrictEqual(false);
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
        expect(result.hasOwnProperty("owner")).toBeTruthy();
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
        expect(result.provider).toBeDefined();
        expect(result.serviceFee).toBeDefined();
        expect(result.delegationCap).toBeDefined();
        expect(result.apr).toBeDefined();
        expect(result.numUsers).toBeDefined();
        expect(result.cumulatedRewards).toBeDefined();
        expect(result.stake).toBeDefined();
        expect(result.topUp).toBeDefined();
        expect(result.locked).toBeDefined();
        expect(result.featured).toBeDefined();
      }
    });

    it("should return provider details", async () => {
      const filter = new ProviderFilter();
      const results = await providerService.getProviders(filter);

      for (const result of results) {
        expect(result.hasOwnProperty("provider")).toBeTruthy();
        expect(result.hasOwnProperty("owner")).toBeTruthy();
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

    it("should verify if provider contain identity property", async () => {
      const filter = new ProviderFilter();
      filter.identity = "meria";

      const results = await providerService.getProviders(filter);

      for (const result of results) {
        if (result.numNodes > 30) {
          expect(result.identity).toBeDefined();
          expect(result.identity).toStrictEqual("meria");
        }
      }
    });

    it('some providers should be included', async () => {
      if (!apiConfigService.getMockNodes()) {
        const vipProviders: { [key: string]: string; } = {
          staking_agency:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat',
          istari_vision:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqrhlllls062tu4',
          truststaking:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzhllllsp9wvyl',
          partnerstaking:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q',
          meria:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85',
          thepalmtreenw:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5',
          arcstake:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqz8llllsh6u4jp',
          primalblock:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqx8llllsxavffq',
          everstake:
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq28llllsu54ydr',
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

    it(`should return providers details with "providers" filter applied`, async () => {
      const filter = new ProviderFilter();
      filter.providers = ["erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu", "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85"];
      const results = await providerService.getProviders(filter);

      const providerResults = results.map((providers) => providers.provider);

      expect(providerResults.includes("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu")).toBeTruthy();
      expect(providerResults.includes("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85")).toBeTruthy();
    });

    it(`should return automaticActivation and checkCapOnRedelegate fields for provider`, async () => {
      const filter = new ProviderFilter();
      filter.providers = ["erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu"];

      const results = await providerService.getProviders(filter);

      for (const result of results) {
        expect(result.automaticActivation).toBeDefined();
        expect(result.checkCapOnRedelegate).toBeDefined();
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
