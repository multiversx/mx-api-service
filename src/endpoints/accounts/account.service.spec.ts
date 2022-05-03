import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { ElasticService } from "src/common/elastic/elastic.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { PluginService } from "src/common/plugins/plugin.service";
import { SmartContractResultService } from "../sc-results/scresult.service";
import { StakeService } from "../stake/stake.service";
import { TransactionService } from "../transactions/transaction.service";
import { TransferService } from "../transfers/transfer.service";
import { VmQueryService } from "../vm.query/vm.query.service";
import { AccountService } from "./account.service";

const elasticServiceMock = () => ({
  getCount: jest.fn(),
});

const CachingServiceMock = () => ({
  getOrSetCache: jest.fn(),
});


const GatewayServiceMock = () => {

};

const ApiConfigServiceMock = () => {

};

const VmQueryServiceMock = () => {

};

const TransactionServiceMock = () => {

};

const StakeServiceMock = () => {

};

const TransferServiceMock = () => {

};

const SmartContractResultServiceMock = () => {

};

const PluginServiceMock = () => {

};

const GatewayServiceProvider = {
  provide: GatewayService,
  useFactory: GatewayServiceMock,
};

const ApiConfigServiceProvider = {
  provide: ApiConfigService,
  useFactory: ApiConfigServiceMock,
};

const VmQueryServiceProvider = {
  provide: VmQueryService,
  useFactory: VmQueryServiceMock,
};

const TransactionServiceProvider = {
  provide: TransactionService,
  useFactory: TransactionServiceMock,
};

const StakeServiceProvider = {
  provide: StakeService,
  useFactory: StakeServiceMock,
};

const TransferServiceProvider = {
  provide: TransferService,
  useFactory: TransferServiceMock,
};

const SmartContractResultServiceProvider = {
  provide: SmartContractResultService,
  useFactory: SmartContractResultServiceMock,
};

const PluginServiceProvider = {
  provide: PluginService,
  useFactory: PluginServiceMock,
};

describe('Account Service', () => {
  let serviceAccount: AccountService;
  let cachingService: any;


  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: CachingService, useFactory: CachingServiceMock },
        { provide: ElasticService, useFactory: elasticServiceMock },
        GatewayServiceProvider,
        ApiConfigServiceProvider,
        VmQueryServiceProvider,
        TransactionServiceProvider,
        StakeServiceProvider,
        TransferServiceProvider,
        SmartContractResultServiceProvider,
        PluginServiceProvider,
      ],
    }).compile();

    serviceAccount = await module.get<AccountService>(AccountService);
    cachingService = await module.get<CachingService>(CachingService);
  });

  it('should be defined', () => {
    expect(serviceAccount).toBeDefined();
  });

  describe('getCount', () => {
    it('get total number of accounts', async () => {
      expect(cachingService.getOrSetCache).not.toHaveBeenCalled();
      cachingService.getOrSetCache.mockResolvedValue(20000);

      const result = await serviceAccount.getAccountsCount();

      expect(cachingService.getOrSetCache).toHaveBeenCalled();
      expect(result).toStrictEqual(20000);
    });
  });

  describe('getAccountUsername', () => {
    it('get username account', async () => {
      const mockAddress: string = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const mockUsername: string = 'alice';
      cachingService.getOrSetCache.mockResolvedValue(mockUsername);

      const result = await serviceAccount.getAccountUsername(mockAddress);
      expect(result).toStrictEqual(mockUsername);
    });
  });
});
