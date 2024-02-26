import { INestApplication } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AccountService } from "src/endpoints/accounts/account.service";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { DelegationLegacyService } from "src/endpoints/delegation.legacy/delegation.legacy.service";
import { DelegationService } from "src/endpoints/delegation/delegation.service";
import { NftService } from "src/endpoints/nfts/nft.service";
import { SmartContractResultService } from "src/endpoints/sc-results/scresult.service";
import { StakeService } from "src/endpoints/stake/stake.service";
import { TokenService } from "src/endpoints/tokens/token.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransferService } from "src/endpoints/transfers/transfer.service";
import { WaitingListService } from "src/endpoints/waiting-list/waiting.list.service";
import { AccountController } from "src/endpoints/accounts/account.controller";
import { mockAccountService, mockApiConfigService, mockCollectionService, mockDelegationLegacyService, mockDelegationService, mockNftService, mockSmartContractResultService, mockStakeService, mockTokenService, mockTransactionService, mockTransferService, mockWaitingListService } from "src/test/integration/controllers/services.mock/account.services.mock";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { AccountModule } from "src/endpoints/accounts/account.module";
import { CollectionModule } from "src/endpoints/collections/collection.module";
import { DelegationLegacyModule } from "src/endpoints/delegation.legacy/delegation.legacy.module";
import { DelegationModule } from "src/endpoints/delegation/delegation.module";
import { NftModule } from "src/endpoints/nfts/nft.module";
import { SmartContractResultModule } from "src/endpoints/sc-results/scresult.module";
import { StakeModule } from "src/endpoints/stake/stake.module";
import { TokenModule } from "src/endpoints/tokens/token.module";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";
import { TransferModule } from "src/endpoints/transfers/transfer.module";
import { WaitingListModule } from "src/endpoints/waiting-list/waiting.list.module";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ConfigModule } from "@nestjs/config";
import request = require('supertest');


describe('AccountController', () => {
  let app: INestApplication;
  const path = "/accounts";

  const accountServiceMocks = mockAccountService();

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      imports: [
        AccountModule,
        TokenModule,
        NftModule,
        DelegationLegacyModule,
        WaitingListModule,
        StakeModule,
        TransactionModule,
        SmartContractResultModule,
        CollectionModule,
        TransferModule,
        ApiConfigModule,
        DelegationModule,
        ConfigModule.forRoot({}),
      ],
    })
      .overrideProvider(AccountService).useValue(accountServiceMocks)
      .overrideProvider(TokenService).useValue(mockTokenService())
      .overrideProvider(NftService).useValue(mockNftService())
      .overrideProvider(DelegationLegacyService).useValue(mockDelegationLegacyService())
      .overrideProvider(WaitingListService).useValue(mockWaitingListService())
      .overrideProvider(StakeService).useValue(mockStakeService())
      .overrideProvider(TransactionService).useValue(mockTransactionService())
      .overrideProvider(SmartContractResultService).useValue(mockSmartContractResultService())
      .overrideProvider(CollectionService).useValue(mockCollectionService())
      .overrideProvider(TransferService).useValue(mockTransferService())
      .overrideProvider(ApiConfigService).useValue(mockApiConfigService())
      .overrideProvider(DelegationService).useValue(mockDelegationService())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe("GET /accounts", () => {
    it('should return the default list of 25 accounts', async () => {
      const defaultAccountsList = createMockAccountsList(25);
      accountServiceMocks.getAccounts.mockReturnValue(defaultAccountsList);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .expect(response => {
          expect(response.body.length).toBe(25);
          expect(response.body).toEqual(defaultAccountsList);
        });
    });

    it('should return a paginated list of accounts when "from" and "size" query parameters are provided', async () => {
      const paginatedAccountsList = createMockAccountsList(10);
      accountServiceMocks.getAccounts.mockReturnValue(paginatedAccountsList);

      const queryPagination = new QueryPagination({ from: 5, size: 10 });
      await request(app.getHttpServer())
        .get(`${path}?from=${queryPagination.from}&size=${queryPagination.size}`)
        .expect(200)
        .expect(response => {
          expect(response.body.length).toBe(10);
          expect(response.body).toEqual(paginatedAccountsList);
        });
    });

    it('should sort accounts by balance when "sort" query parameter is set to "balance"', async () => {
      const sortedAccountsList = createMockAccountsList(10).sort((a, b) => parseInt(a.balance) - parseInt(b.balance));
      accountServiceMocks.getAccounts.mockReturnValue(sortedAccountsList);

      const sort = 'balance';
      await request(app.getHttpServer())
        .get(`${path}?sort=${sort}`)
        .expect(200)
        .expect(response => {
          const isSortedByBalance = response.body.every(
            (account: { balance: string; }, i: number, arr: { balance: string; }[]) => i === 0 || parseInt(arr[i - 1].balance) <= parseInt(account.balance));
          expect(isSortedByBalance).toBeTruthy();
        });
    });

    it('should return only smart contracts when "isSmartContract" query parameter is set to true', async () => {
      const smartContractsList = createMockAccountsList(5, undefined, true);
      accountServiceMocks.getAccounts.mockReturnValue(smartContractsList);
      await request(app.getHttpServer())
        .get(`${path}?isSmartContract=true`)
        .expect(200)
        .expect(response => {
          expect(response.body.length).toBe(5);
        });
    });
  });

  describe("GET /accounts/count", () => {
    it('should return total accounts count', async () => {
      accountServiceMocks.getAccountsCount.mockReturnValue(100);

      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(100);
        });
    });

    it('should return total smart contracts count', async () => {
      const params = new URLSearchParams({ isSmartContract: "true" }).toString();
      accountServiceMocks.getAccountsCount.mockReturnValue(25);

      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(25);
        });
    });

    it('should return accounts details for a given owner address', async () => {
      const ownerAddress: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";
      const params = new URLSearchParams({ ownerAddress: ownerAddress }).toString();
      accountServiceMocks.getAccountsCount.mockReturnValue(25);

      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(25);
        });
    });

    it('should throw 400 Bad Request for a given invalid Bech32 owner address', async () => {
      const ownerAddress: string = "invalidBech32Address";
      const params = new URLSearchParams({ ownerAddress: ownerAddress }).toString();
      accountServiceMocks.getAccountsCount.mockReturnValue(25);

      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'ownerAddress' (a bech32 address is expected)");
        });
    });

    it('should throw 400 Bad Request for a given isSmartContract value', async () => {
      const params = new URLSearchParams({ isSmartContract: "invalidBoolean" }).toString();
      accountServiceMocks.getAccountsCount.mockReturnValue(25);

      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'isSmartContract' (optional boolean string is expected)");
        });
    });
  });

  describe("GET /accounts/c", () => {
    it('should return total alternative accounts count', async () => {
      accountServiceMocks.getAccountsCount.mockReturnValue(100);

      await request(app.getHttpServer())
        .get(`${path}/c`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(100);
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  function createMockAccountsList(numberOfAccounts: number, ownerAddress = null, includeSmartContracts = false) {
    return Array.from({ length: numberOfAccounts }, (_, index) => {
      const isSmartContractAddress = includeSmartContracts && Math.random() < 0.5;

      return {
        address: ownerAddress || (isSmartContractAddress ? generateMockSmartContractAddress() : generateMockAddress()),
        balance: generateRandomBalance(),
        nonce: Math.floor(Math.random() * 100),
        timestamp: Math.floor(Date.now() / 1000) - index * 1000,
        shard: Math.floor(Math.random() * 4),
        ownerAddress: ownerAddress || generateMockAddress(),
        ownerAssets: undefined,
        assets: undefined,
      };
    });
  }

  function generateMockSmartContractAddress() {
    const prefix = 'erd1';
    const middle = 'q'.repeat(38);
    const suffixLength = 62 - prefix.length - middle.length;
    let suffix = '';

    while (suffix.length < suffixLength) {
      suffix += Math.random().toString(36).substr(2);
    }

    suffix = suffix.substring(0, suffixLength);

    return `${prefix}${middle}${suffix}`;
  }

  function generateRandomBalance() {
    return (Math.floor(Math.random() * 1000000) + 100000).toString();
  }

  function generateMockAddress() {
    const desiredLength = 62 - 'erd1'.length;
    let address = 'erd1';

    while (address.length < desiredLength + 'erd1'.length) {
      address += Math.random().toString(36).substring(2);
    }

    return address.substring(0, desiredLength + 'erd1'.length);
  }
});


