import { AccountEsdtHistory } from '../../endpoints/accounts/entities/account.esdt.history';
import { AccountKey } from '../../endpoints/accounts/entities/account.key';
import { AddressUtils } from 'src/utils/address.utils';
import { CachingService } from '../../common/caching/caching.service';
import { Test } from '@nestjs/testing';
import { AccountService } from 'src/endpoints/accounts/account.service';
import { PublicAppModule } from 'src/public.app.module';
import { ElasticService } from 'src/common/elastic/elastic.service';
import { DeployedContract } from 'src/endpoints/accounts/entities/deployed.contract';
import '../../utils/extensions/jest.extensions';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

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

      const results = await accountService.getAccountsCount();

      expect(results).toStrictEqual(49100);
    });
  });

  describe("getAccountUsername", () => {
    it("should return account username", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      jest
        .spyOn(AccountService.prototype, 'getAccountUsernameRaw')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string) => "alice.elrond"));

      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const results = await accountService.getAccountUsername(address);

      expect(results).toStrictEqual('alice.elrond');
    });
  });

  describe("getAccount", () => {
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

    it("should return account details if IndexerV3Flag is active", async () => {
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

    it("should return account details if getUseLegacyElastic is active", async () => {
      const mock_isAddressValid = jest.spyOn(AddressUtils, 'isAddressValid');
      mock_isAddressValid.mockImplementation(() => true);

      jest.spyOn(ApiConfigService.prototype, 'getUseLegacyElastic')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => true));

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

      const results = await accountService.getAccounts({ from: 0, size: 10 });

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
      const results = await accountService.getAccountHistory(address, { from: 0, size: 2 });

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
      const results = await accountService.getAccountTokenHistory(address, token, { from: 0, size: 1 });

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
      const results = await accountService.getAccountTokenHistory(address, token, { from: 0, size: 1 });

      expect(results).toStrictEqual([]);
    });
  });

  describe("getAccountUsernameRaw", () => {
    it("should return undefined because test simulates that account is undefined", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      jest
        .spyOn(AccountService.prototype, 'getAccount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => null));

      const address: string = "erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97";
      const results = await accountService.getAccountUsernameRaw(address);

      expect(results).toBeNull();
    });

    it('should return account username details', async () => {
      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const results = await accountService.getAccountUsernameRaw(address);

      expect(results).toStrictEqual('alice.elrond');
    });
  });
});
