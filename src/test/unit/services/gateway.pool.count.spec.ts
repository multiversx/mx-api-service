import { GatewayService } from "src/common/gateway/gateway.service";

describe('GatewayService transaction pool', () => {
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

  it('should read a pool over the response size limit as undefined', async () => {
    apiService.get.mockRejectedValue({ message: 'maxContentLength size of 2097152 exceeded' });

    expect(await gatewayService.getTransactionPool()).toBeUndefined();
  });

  it('should keep throwing other failures of the pool', async () => {
    apiService.get.mockRejectedValue({ message: 'connect ECONNREFUSED' });

    await expect(gatewayService.getTransactionPool()).rejects.toEqual({ message: 'connect ECONNREFUSED' });
  });

  it('should sum the counts of every shard', async () => {
    expect(await gatewayService.getTransactionPoolCount()).toStrictEqual(10);
    expect(apiService.get).toHaveBeenCalledWith('https://gateway/transaction/pool/count', expect.anything(), undefined);
  });
});
