import { Test } from '@nestjs/testing';
import { AccountService } from 'src/endpoints/accounts/account.service';
import { PublicAppModule } from 'src/public.app.module';
import { DeployedContract } from 'src/endpoints/accounts/entities/deployed.contract';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/jest.extensions';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { AddressUtils, CachingService, ElasticService } from '@multiversx/sdk-nestjs';
import { AccountKey } from 'src/endpoints/accounts/entities/account.key';
import { AccountEsdtHistory } from 'src/endpoints/accounts/entities/account.esdt.history';
import { AccountFilter } from 'src/endpoints/accounts/entities/account.filter';
import { AccountHistoryFilter } from 'src/endpoints/accounts/entities/account.history.filter';
import { Guardian } from 'src/common/gateway/entities/guardian';
import { GuardianResult } from 'src/common/gateway/entities/guardian.result';

describe('Account Service', () => {
  let accountService: AccountService;

  const accountHistory = [
    {
      address: 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97',
      balance: '3074841073460000000',
      timestamp: 1649147436,
      isSender: true,
    },
    {
      address: 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97',
      balance: '3075399483460000000',
      timestamp: 1649147376,
      isSender: true,
    },
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    accountService = moduleRef.get<AccountService>(AccountService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });


  describe("getAccountsCount", () => {
    it("should return total accounts count", async () => {

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      jest
        .spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string) => 49100));

      const results = await accountService.getAccountsCount(new AccountFilter());

      expect(results).toStrictEqual(49100);
    });
  });

  describe.only("getAccount", () => {
    it("should return null because test simulates that address is not valid ", async () => {
      const mock_isAddressValid = jest.spyOn(AddressUtils, 'isAddressValid');
      mock_isAddressValid.mockImplementation(() => false);

      const address: string = " ";
      const results = await accountService.getAccount(address);

      expect(results).toBeNull();
    });

    it("should return account details", async () => {
      const mock_isAddressValid = jest.spyOn(AddressUtils, 'isAddressValid');
      mock_isAddressValid.mockImplementation(() => true);

      const address: string = "erd1cnyng48s8lrjn95rpdfgykxl5993c5qhn5jqt0ar960f7v3umnrsy9yx0s";
      const results = await accountService.getAccount(address);

      expect(results).toHaveProperties(
        ['address', 'balance', 'nonce', 'shard', 'code',
          'codeHash', 'rootHash', 'txCount', 'scrCount',
          'username', 'shard', 'developerReward', 'ownerAddress', 'scamInfo',
        ]);
    });

    it('should return account details with isGuarded = true and guardian data extra fields when isGuarded is true in codeAttributes', async () => {
      const address = 'erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx';

      const mockGuardianData: GuardianResult = {
        guardianData: {
          activeGuardian: new Guardian({
            activationEpoch: 9,
            address: 'erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx',
            serviceUID: 'ServiceID',
          }),
          pendingGuardian: new Guardian({
            activationEpoch: 13,
            address: 'erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8',
            serviceUID: 'serviceUID',
          }),
          guarded: true,
        },
      };

      const mock_decodeCodeMetadata = jest.spyOn(AddressUtils, 'decodeCodeMetadata');
      mock_decodeCodeMetadata.mockImplementation((_codeMetadata: string) => {
        return {
          isUpgradeable: false,
          isReadable: true,
          isGuarded: true,
          isPayable: false,
          isPayableBySmartContract: false,
        };
      });

      jest.spyOn(accountService['gatewayService'], 'getGuardianData').mockResolvedValue(mockGuardianData);
      const result = await accountService.getAccount(address, undefined, true);

      expect(result?.isGuarded).toStrictEqual(true);
      expect(result?.activeGuardianActivationEpoch).toStrictEqual(9);
      expect(result?.activeGuardianAddress).toStrictEqual('erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx');
      expect(result?.activeGuardianServiceUid).toStrictEqual('ServiceID');
      expect(result?.pendingGuardianActivationEpoch).toStrictEqual(13);
      expect(result?.pendingGuardianAddress).toStrictEqual('erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8');
      expect(result?.pendingGuardianServiceUid).toStrictEqual('serviceUID');
    });

    it('should return account details with isGuarded = false when isGuarded is false in codeAttributes', async () => {
      const address = 'erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx';
      const mockGuardianData: GuardianResult = {
        guardianData: {
          activeGuardian: undefined,
          pendingGuardian: undefined,
          guarded: false,
        },
      };

      const mock_decodeCodeMetadata = jest.spyOn(AddressUtils, 'decodeCodeMetadata');
      mock_decodeCodeMetadata.mockImplementation((_codeMetadata: string) => {
        return {
          isUpgradeable: false,
          isReadable: true,
          isGuarded: false,
          isPayable: false,
          isPayableBySmartContract: false,
        };
      });

      jest.spyOn(accountService['gatewayService'], 'getGuardianData').mockResolvedValue(mockGuardianData);
      const result = await accountService.getAccount(address);

      expect(result?.isGuarded).toStrictEqual(false);
      expect(result?.activeGuardianActivationEpoch).toBeUndefined();
      expect(result?.activeGuardianAddress).toBeUndefined();
      expect(result?.activeGuardianServiceUid).toBeUndefined();
      expect(result?.pendingGuardianActivationEpoch).toBeUndefined();
      expect(result?.pendingGuardianAddress).toBeUndefined();
      expect(result?.pendingGuardianServiceUid).toBeUndefined();
    });

    it.skip("should return account details if IndexerV3Flag is active", async () => {
      jest.spyOn(ApiConfigService.prototype, 'getIsIndexerV3FlagActive')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => true));

      const mock_isAddressValid = jest.spyOn(AddressUtils, 'isAddressValid');
      mock_isAddressValid.mockImplementation(() => true);

      const address: string = "erd1cnyng48s8lrjn95rpdfgykxl5993c5qhn5jqt0ar960f7v3umnrsy9yx0s";
      const results = await accountService.getAccount(address);

      expect(results).toHaveProperties(
        ['address', 'balance', 'nonce', 'shard', 'code',
          'codeHash', 'rootHash', 'txCount', 'scrCount',
          'username', 'shard', 'developerReward', 'ownerAddress', 'scamInfo',
        ]);
    });
  });

  describe("getAccountDeployedAt", () => {
    it("should return the deployed timestamp for a given address", async () => {

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      jest
        .spyOn(AccountService.prototype, 'getAccountDeployedAtRaw')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string) => 1616769300));

      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const results = await accountService.getAccountDeployedAt(address);

      expect(results).toStrictEqual(1616769300);
    });

    it("should return null because test simulates that scDeployed is undefined", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      jest
        .spyOn(ElasticService.prototype, 'getItem')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _key: string, _identifier: string) => undefined));

      jest
        .spyOn(AccountService.prototype, 'getAccountDeployedAtRaw')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string) => null));

      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const results = await accountService.getAccountDeployedAt(address);

      expect(results).toBeNull();
    });
  });

  describe("getAccountDeployedAtRaw", () => {
    it("should return account deployed timestamp because test simulates that account is a smart-contract", async () => {
      const address: string = "erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy";
      const results = await accountService.getAccountDeployedAtRaw(address);

      expect(results).toStrictEqual(1636897470);
    });

    it("should return null because test simulates that scDeployed is undefined and should return null", async () => {
      jest
        .spyOn(ElasticService.prototype, 'getItem')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _key: string, _identifier: string) => undefined));

      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const results = await accountService.getAccountDeployedAtRaw(address);

      expect(results).toBeNull();
    });
  });

  describe("getAccounts", () => {
    it("should return 10 accounts", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      const results = await accountService.getAccounts({ from: 0, size: 10 }, new AccountFilter());

      expect(results).toHaveLength(10);
    });
  });

  describe("getDeferredAccount", () => {
    it("should return empty list because test simulates that address is not deferred", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const results = await accountService.getDeferredAccount(address);

      expect(results).toStrictEqual([]);
    });
  });

  //KindReminder
  describe("getKeys", () => {
    it("should return a list of keys of type AccountKey for a specific address", async () => {
      const mock_isAddressValid = jest.spyOn(AddressUtils, 'bech32Decode');
      mock_isAddressValid.mockImplementation(() => "000000000000000000010000000000000000000000000000000000001effffff");

      const results = await accountService.getKeys("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85");

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new AccountKey()));
        expect(result).toHaveProperties(['blsKey', 'stake', 'topUp', 'status', 'rewardAddress', 'queueIndex', 'queueSize']);
      }
    });

    it("should return an empty list because test simulates that provider account does not contain any bls key", async () => {
      const mock_isAddressValid = jest.spyOn(AddressUtils, 'bech32Decode');
      mock_isAddressValid.mockImplementation(() => "");

      const results = await accountService.getKeys("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85");

      expect(results).toStrictEqual([]);
    });
  });

  describe("getAccountContracts", () => {
    it("should return account contracts details", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      const address: string = "erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97";
      const results = await accountService.getAccountContracts({ from: 0, size: 2 }, address);

      expect(results).toHaveLength(2);

      for (const result of results) {
        expect(results).toHaveLength(2);
        expect(result).toHaveStructure(Object.keys(new DeployedContract()));
      }
    });
  });

  describe("getAccountContractsCount", () => {
    it("should return total contracts count for a specific account address", async () => {

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      jest
        .spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => 20));

      const address: string = "erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97";
      const results = await accountService.getAccountContractsCount(address);

      expect(results).toStrictEqual(20);
    });
  });

  describe("getAccountHistory", () => {
    it("should return total contracts count for a specific account address", async () => {

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      jest
        .spyOn(ElasticService.prototype, 'getList')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => accountHistory));

      const address: string = "erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97";
      const results = await accountService.getAccountHistory(address, { from: 0, size: 2 }, new AccountHistoryFilter({}));

      expect(results).toHaveLength(2);

      expect(results).toEqual(expect.arrayContaining([
        expect.objectContaining(
          {
            address: 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97',
            balance: '3074841073460000000',
            timestamp: 1649147436,
            isSender: true,
          }
        ),
      ]));
    });
  });

  describe("getAccountTokenHistory", () => {
    it("should return account token history", async () => {
      const token: string = "RIDE-7d18e9";
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
      const results = await accountService.getAccountTokenHistory(address, token, { from: 0, size: 1 }, new AccountHistoryFilter({}));

      if (!results) {
        throw new Error('Properties are not defined');
      }

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new AccountEsdtHistory()));
      }
    });

    it("should return empty list because test simulates that token is not defined/found", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      jest
        .spyOn(ElasticService.prototype, 'getList')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => []));

      const token: string = "";
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
      const results = await accountService.getAccountTokenHistory(address, token, { from: 0, size: 1 }, new AccountHistoryFilter({}));

      expect(results).toStrictEqual([]);
    });
  });
});
