import { GatewayService } from "src/common/gateway/gateway.service";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";

describe('GatewayService transaction pool count', () => {
  let gatewayService: GatewayService;
  let apiService: any;

  beforeEach(() => {
    apiService = {
      get: jest.fn().mockResolvedValue({ data: { data: { txPoolCounts: { '0': 1, '1': 2, '2': 3, '4294967295': 4 } } } }),
    };

    gatewayService = new GatewayService(
      { getGatewayUrl: () => 'https://gateway', getSnapshotlessGatewayUrl: () => undefined } as any,
      apiService,
    );
    Object.assign(gatewayService, { eventEmitter: { emit: jest.fn() } });
  });

  it('should sum the counts of every shard', async () => {
    expect(await gatewayService.getTransactionPoolCount()).toStrictEqual(10);
    expect(apiService.get).toHaveBeenCalledWith('https://gateway/transaction/pool/count', expect.anything(), undefined);
  });

  it('should ask for the count of a type', async () => {
    expect(await gatewayService.getTransactionPoolCount(TransactionType.SmartContractResult)).toStrictEqual(10);
    expect(apiService.get).toHaveBeenCalledWith('https://gateway/transaction/pool/count?type=SmartContractResult', expect.anything(), undefined);
  });
});
