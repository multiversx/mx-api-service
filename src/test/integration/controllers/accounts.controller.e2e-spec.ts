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
import { AccountModule } from "src/endpoints/accounts/account.module";
import { TokenModule } from "src/endpoints/tokens/token.module";
import { NftModule } from "src/endpoints/nfts/nft.module";
import { DelegationLegacyModule } from "src/endpoints/delegation.legacy/delegation.legacy.module";
import { WaitingListModule } from "src/endpoints/waiting-list/waiting.list.module";
import { StakeModule } from "src/endpoints/stake/stake.module";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";
import { SmartContractResultModule } from "src/endpoints/sc-results/scresult.module";
import { CollectionModule } from "src/endpoints/collections/collection.module";
import { TransferModule } from "src/endpoints/transfers/transfer.module";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { DelegationModule } from "src/endpoints/delegation/delegation.module";
import { mockApiConfigService, mockCollectionService, mockDelegationLegacyService, mockDelegationService, mockNftService, mockSmartContractResultService, mockStakeService, mockTokenService, mockTransactionService, mockTransferService, mockWaitingListService } from "src/test/integration/controllers/services.mock/account.services.mock";
import request = require('supertest');

describe('AccountController', () => {
  let app: INestApplication;
  const path = "/accounts";

  const mockAccountService = () => ({
    getAccounts: jest.fn().mockResolvedValue([]),
    getAccountsCount: jest.fn().mockResolvedValue(0),
    getAccount: jest.fn().mockResolvedValue({}),
    getDeferredAccount: jest.fn().mockResolvedValue([]),
    getAccountVerification: jest.fn().mockResolvedValue(null),
    getAccountContracts: jest.fn().mockResolvedValue([]),
    getAccountContractsCount: jest.fn().mockResolvedValue(0),
    getKeys: jest.fn().mockResolvedValue([]),
    getWaitingListForAddress: jest.fn().mockResolvedValue([]),
  });

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


});


