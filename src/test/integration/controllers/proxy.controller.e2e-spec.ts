import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/jest.extensions';
import { ProxyController } from 'src/endpoints/proxy/proxy.controller';

describe('Proxy Controller', () => {
  let proxyController: ProxyController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    proxyController = moduleRef.get<ProxyController>(ProxyController);
  });

  describe('getAddress', () => {
    it('should return address details (gateway source)', async () => {
      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const result = await proxyController.getAddress(address);

      expect(result).toEqual(expect.objectContaining({
        data: expect.objectContaining({
          account: expect.objectContaining({
            address: address,
            username: "alice.elrond",
          }),
        }),
      }));
    });
  });

  describe('getAddressBalance', () => {
    it('should return address current balance', async () => {
      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const result = await proxyController.getAddressBalance(address);

      expect(result).toEqual(expect.objectContaining({
        code: 'successful',
      }));
    });
  });

  describe('getAddressNonce', () => {
    it('should return address nonce', async () => {
      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const result = await proxyController.getAddressNonce(address);

      expect(result).toEqual(expect.objectContaining({
        data: expect.objectContaining({
          nonce: 42,
        }),
      }));
    });
  });

  describe('getAddressShard', () => {
    it('should return address shard', async () => {
      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const result = await proxyController.getAddressShard(address);

      expect(result).toEqual(expect.objectContaining({
        data: expect.objectContaining({
          shardID: 0,
        }),
      }));
    });
  });

  describe('getAddressTransactions', () => {
    it('should return address transactions', async () => {
      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const result = await proxyController.getAddressTransactions(address);

      expect(result).toEqual(expect.objectContaining({
        code: 'successful',
      }));
    });
  });

  describe('getAddressEsdt', () => {
    it('should return address tokens', async () => {
      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const result = await proxyController.getAddressEsdt(address);

      expect(result).toEqual(expect.objectContaining({
        code: 'successful',
      }));
    });
  });

  describe('getNetworkStatusShard', () => {
    it('should return network status shard', async () => {
      const shard: string = '0';
      const result = await proxyController.getNetworkStatusShard(shard);

      expect(result).toEqual(expect.objectContaining({
        code: 'successful',
      }));
    });
  });

  describe('getNetworkConfig', () => {
    it('should return network configuration', async () => {
      const result = await proxyController.getNetworkConfig();
      expect(result).toEqual(expect.objectContaining({
        code: 'successful',
      }));
    });
  });

  describe('getNetworkEconomics', () => {
    it('should return network economics', async () => {
      const result = await proxyController.getNetworkEconomics();
      expect(result).toEqual(expect.objectContaining({
        code: 'successful',
      }));
    });
  });

  describe('getBlockByShardAndNonce', () => {
    it('should return block details by shard and nonce', async () => {
      const shard: string = "0";
      const nonce: number = 100;
      const result = await proxyController.getBlockByShardAndNonce(shard, nonce);

      expect(result).toEqual(expect.objectContaining({
        data: expect.objectContaining({
          block: expect.objectContaining({
            nonce: 100,
            round: 100,
            epoch: 0,
            shard: 0,
          }),
        }),
        code: 'successful',
      }));
    });
  });
});
