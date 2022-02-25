import { CachingService } from '../../common/caching/caching.service';
import { Test } from '@nestjs/testing';
import { AccountService } from 'src/endpoints/accounts/account.service';
import { Account } from 'src/endpoints/accounts/entities/account';
import { AccountDetailed } from 'src/endpoints/accounts/entities/account.detailed';
import { DeployedContract } from 'src/endpoints/accounts/entities/deployed.contract';
import { PublicAppModule } from 'src/public.app.module';
import '../../utils/extensions/jest.extensions';
import { AccountKey } from 'src/endpoints/accounts/entities/account.key';
import { TokenService } from 'src/endpoints/tokens/token.service';

describe('Account Service', () => {
  let accountService: AccountService;
  let tokensService: TokenService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    accountService = moduleRef.get<AccountService>(AccountService);
    tokensService = moduleRef.get<TokenService>(TokenService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe("Get Account", () => {
    it("should return account details", async () => {
      const address: string = "erd1cnyng48s8lrjn95rpdfgykxl5993c5qhn5jqt0ar960f7v3umnrsy9yx0s";

      const results = await accountService.getAccount(address);

      expect(results).toHaveStructure(Object.keys(new AccountDetailed()));
    });
  });

  describe("Get Accounts", () => {
    it("should return 10 accounts", async () => {
      const results = await accountService.getAccounts({ from: 0, size: 10 });


      for (const result of results) {
        expect(results).toHaveLength(10);
        expect(result).toHaveStructure(Object.keys(new Account()));
      }
    });

    it("returned accounts contains properties", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      const results = await accountService.getAccounts({ from: 0, size: 10 });

      for (const result of results) {
        expect(result.hasOwnProperty("address")).toBeTruthy();
        expect(result.hasOwnProperty("balance")).toBeTruthy();
        expect(result.hasOwnProperty("nonce")).toBeTruthy();
        expect(result.hasOwnProperty("shard")).toBeTruthy();
      }
    });
  });

  describe("Get Accounts Contract", () => {
    it("should return contracts accounts", async () => {
      const contractAddress: string = "erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97";
      const results = await accountService.getAccountContracts({ from: 0, size: 5 }, contractAddress);

      for (const result of results) {
        expect(results).toHaveLength(5);
        expect(result).toHaveStructure(Object.keys(new DeployedContract()));
      }
    });
  });

  describe("Get Account Username", () => {
    it("should return account username", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const result = await accountService.getAccountUsername(address);

      expect(result).toStrictEqual("alice.elrond");
    });
  });

  describe("Get Keys", () => {
    it("should return keys details", async () => {
      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const results = await accountService.getKeys(address);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new AccountKey()));
      }
    });
  });

  describe('Get Account Deployed', () => {
    it(`should return the deployed timestamp for a given address`, async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const result = await accountService.getAccountDeployedAt(address);

      expect(typeof result).toStrictEqual('number');
    });
  });

  describe('Account Token balance history', () => {
    it('should return the token EGLD balance history ', async () => {
      const address: string = "erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97";
      const accountTokens = await tokensService.getTokensForAddress(address, { from: 0, size: 1 }, {});

      if (accountTokens.length) {
        const accountTokenHistories = await accountService.getAccountTokenHistory(address,
          accountTokens[0].identifier, { from: 0, size: 1 });

        for (const account of accountTokenHistories) {
          expect(account).toHaveProperty('address');
          expect(account).toHaveProperty('balance');
          expect(account).toHaveProperty('timestamp');
          expect(account).toHaveProperty('token');
        }
      }
    });
  });

  describe("Get Account History", () => {
    it("should return accounts history", async () => {
      const address: string = "erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97";
      const results = await accountService.getAccountHistory(address, { from: 0, size: 1 });

      expect(results).toBeDefined();

      for (const result of results) {
        expect(result).toHaveProperty('address');
        expect(result).toHaveProperty('balance');
        expect(result).toHaveProperty('timestamp');
      }
    });
  });

  //TBD
  describe('Get Deferred Account', () => {
    it(`should return a list of deferred accounts`, async () => {
      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const account = await accountService.getDeferredAccount(address);

      expect(account).toBeInstanceOf(Array);
    });
  });

  describe("Get Count", () => {
    it("should return account contract count", async () => {
      const contractAddress: string = "erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97";
      const result = await accountService.getAccountContractsCount(contractAddress);

      expect(typeof result).toStrictEqual('number');
    });

    it("should return accounts count", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      const results = await accountService.getAccountsCount();

      expect(typeof results).toStrictEqual("number");
    });
  });
});
