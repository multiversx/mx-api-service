import { GatewayService } from "src/common/gateway/gateway.service";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";

describe('GatewayService paged trie requests', () => {
  let gatewayService: GatewayService;
  let apiService: any;

  const firstCheckpoint = { blockNonce: 90, blockHash: 'ab', blockRootHash: 'cd', epoch: 4, iteratorState: ['Dt/+AA=='] };
  const secondCheckpoint = { blockNonce: 90, blockHash: 'ab', blockRootHash: 'cd', epoch: 4, iteratorState: ['Ee/+BB=='] };
  const blockInfo = { nonce: 90, hash: 'ab', rootHash: 'cd' };

  const firstEncoded = Buffer.from(JSON.stringify(firstCheckpoint)).toString('base64url');
  const secondEncoded = Buffer.from(JSON.stringify(secondCheckpoint)).toString('base64url');

  beforeEach(() => {
    apiService = { get: jest.fn() };

    gatewayService = new GatewayService(
      { getGatewayUrl: () => 'https://gateway', getSnapshotlessGatewayUrl: () => undefined } as any,
      apiService,
    );
    Object.assign(gatewayService, { eventEmitter: { emit: jest.fn() }, trieBusyRetryDelayMs: 0 });
  });

  it('should merge object items of every page and drop the checkpoint', async () => {
    apiService.get
      .mockResolvedValueOnce({ data: { data: { esdts: { 'A-1': { balance: '1' } }, blockInfo, iteratorState: firstCheckpoint } } })
      .mockResolvedValueOnce({ data: { data: { esdts: {}, blockInfo, iteratorState: secondCheckpoint } } })
      .mockResolvedValueOnce({ data: { data: { esdts: { 'B-2': { balance: '2' } }, blockInfo } } });

    const result = await gatewayService.getPaged('address/erd1/esdt', GatewayComponentRequest.addressEsdt, 'esdts');

    expect(result).toEqual({ esdts: { 'A-1': { balance: '1' }, 'B-2': { balance: '2' } }, blockInfo });
    expect(apiService.get).toHaveBeenNthCalledWith(1, 'https://gateway/address/erd1/esdt', expect.anything(), undefined);
    expect(apiService.get).toHaveBeenNthCalledWith(2, `https://gateway/address/erd1/esdt?iteratorState=${firstEncoded}`, expect.anything(), undefined);
    expect(apiService.get).toHaveBeenNthCalledWith(3, `https://gateway/address/erd1/esdt?iteratorState=${secondEncoded}`, expect.anything(), undefined);
  });

  it('should send the checkpoint as unpadded base64url', async () => {
    apiService.get
      .mockResolvedValueOnce({ data: { data: { tokens: ['A-1'], iteratorState: firstCheckpoint } } })
      .mockResolvedValueOnce({ data: { data: { tokens: ['B-2'] } } });

    await gatewayService.getPaged('network/esdt/fungible-tokens', GatewayComponentRequest.allFungibleTokens, 'tokens');

    const continuationUrl: string = apiService.get.mock.calls[1][0];
    const encoded = continuationUrl.split('iteratorState=')[1];
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(JSON.parse(Buffer.from(encoded, 'base64url').toString())).toEqual(firstCheckpoint);
  });

  it('should concatenate list items of every page', async () => {
    apiService.get
      .mockResolvedValueOnce({ data: { data: { tokens: ['A-1', 'B-2'], iteratorState: firstCheckpoint } } })
      .mockResolvedValueOnce({ data: { data: { tokens: ['C-3'] } } });

    expect(await gatewayService.getEsdtFungibleTokens()).toEqual(['A-1', 'B-2', 'C-3']);
  });

  it('should append the checkpoint to an url that already has a query', async () => {
    apiService.get
      .mockResolvedValueOnce({ data: { data: { pairs: { aa: '01' }, iteratorState: firstCheckpoint } } })
      .mockResolvedValueOnce({ data: { data: { pairs: { bb: '02' } } } });

    await gatewayService.getPaged('address/erd1/keys?numKeys=1', GatewayComponentRequest.addressKeys, 'pairs');

    expect(apiService.get).toHaveBeenNthCalledWith(2, `https://gateway/address/erd1/keys?numKeys=1&iteratorState=${firstEncoded}`, expect.anything(), undefined);
  });

  it('should return undefined when the first page is handled by the error handler', async () => {
    apiService.get.mockResolvedValueOnce(undefined);

    expect(await gatewayService.getPaged('address/erd1/esdt', GatewayComponentRequest.addressEsdt, 'esdts')).toBeUndefined();
  });

  it('should retry a page answered with system busy', async () => {
    apiService.get
      .mockResolvedValueOnce({ data: { data: { tokens: ['A-1'], iteratorState: firstCheckpoint } } })
      .mockRejectedValueOnce({ status: 429, response: { error: 'too many concurrent trie operations', code: 'system_busy' } })
      .mockResolvedValueOnce({ data: { data: { tokens: ['B-2'] } } });

    expect(await gatewayService.getEsdtFungibleTokens()).toEqual(['A-1', 'B-2']);
    expect(apiService.get).toHaveBeenNthCalledWith(3, `https://gateway/network/esdt/fungible-tokens?iteratorState=${firstEncoded}`, expect.anything(), undefined);
  });

  it('should give up after the busy retries are exhausted', async () => {
    const busy = { status: 429, response: { error: 'too many concurrent trie operations', code: 'system_busy' } };
    apiService.get.mockRejectedValue(busy);

    await expect(gatewayService.getEsdtFungibleTokens()).rejects.toEqual(busy);
    expect(apiService.get).toHaveBeenCalledTimes(6);
  });

  it('should restart the walk once when the checkpoint expired', async () => {
    apiService.get
      .mockResolvedValueOnce({ data: { data: { tokens: ['A-1'], iteratorState: firstCheckpoint } } })
      .mockRejectedValueOnce({ status: 400, response: { error: 'get esdt tokens error: iterator node unavailable: ab', code: 'bad_request' } })
      .mockResolvedValueOnce({ data: { data: { tokens: ['A-1', 'B-2'] } } });

    expect(await gatewayService.getEsdtFungibleTokens()).toEqual(['A-1', 'B-2']);
    expect(apiService.get).toHaveBeenNthCalledWith(3, 'https://gateway/network/esdt/fungible-tokens', expect.anything(), undefined);
  });

  it('should not restart the walk more than once', async () => {
    const expired = { status: 400, response: { error: 'iterator node unavailable: ab', code: 'bad_request' } };
    apiService.get
      .mockResolvedValueOnce({ data: { data: { tokens: ['A-1'], iteratorState: firstCheckpoint } } })
      .mockRejectedValueOnce(expired)
      .mockResolvedValueOnce({ data: { data: { tokens: ['A-1'], iteratorState: firstCheckpoint } } })
      .mockRejectedValueOnce(expired);

    await expect(gatewayService.getEsdtFungibleTokens()).rejects.toEqual(expired);
  });

  it('should not retry other failures', async () => {
    const failure = { status: 500, response: { error: 'the endpoint is only available on metachain nodes', code: 'internal_issue' } };
    apiService.get.mockRejectedValue(failure);

    await expect(gatewayService.getEsdtFungibleTokens()).rejects.toEqual(failure);
    expect(apiService.get).toHaveBeenCalledTimes(1);
  });

  it('should stop a walk that never ends', async () => {
    Object.assign(gatewayService, { maxTriePages: 3 });
    apiService.get.mockResolvedValue({ data: { data: { tokens: ['A-1'], iteratorState: firstCheckpoint } } });

    await expect(gatewayService.getEsdtFungibleTokens()).rejects.toThrow("Trie walk for 'network/esdt/fungible-tokens' exceeded 3 pages");
    expect(apiService.get).toHaveBeenCalledTimes(3);
  });
});
