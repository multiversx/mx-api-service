import { Constants } from "@multiversx/sdk-nestjs-common";
import { EsdtType } from "src/endpoints/esdt/entities/esdt.type";
import { EsdtService } from "src/endpoints/esdt/esdt.service";
import { TokenTransferService } from "src/endpoints/tokens/token.transfer.service";
import { CacheInfo } from "src/utils/cache.info";

describe('Token properties caching', () => {
  const identifier = 'TKN-123456';
  const properties = { identifier, name: 'Token', type: EsdtType.FungibleESDT, decimals: 18 };

  let cachingService: any;

  beforeEach(() => {
    cachingService = {
      getOrSet: jest.fn(async (_key: string, createValue: () => Promise<any>) => await createValue()),
      set: jest.fn(),
    };
  });

  describe('TokenTransferService', () => {
    let service: TokenTransferService;
    let esdtService: any;

    beforeEach(() => {
      esdtService = { getEsdtTokenProperties: jest.fn().mockResolvedValue(properties) };
      service = new TokenTransferService(cachingService, esdtService, { getTokenAssets: jest.fn() } as any, {} as any);
    });

    it('should cache existing token properties for the standard ttl', async () => {
      const result = await service.getTokenTransferProperties({ identifier });

      const { key, ttl } = CacheInfo.TokenTransferProperties(identifier);

      expect(result?.name).toStrictEqual('Token');
      expect(cachingService.getOrSet).toHaveBeenCalledWith(key, expect.any(Function), ttl, ttl, false);
      expect(cachingService.set).not.toHaveBeenCalled();
    });

    it('should cache missing token properties for one minute', async () => {
      esdtService.getEsdtTokenProperties.mockResolvedValue(undefined);

      const result = await service.getTokenTransferProperties({ identifier });

      expect(result).toBeNull();
      expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TokenTransferProperties(identifier).key, null, Constants.oneMinute());
    });

    it('should cache the missing tokens from logs for one minute and leave the existing ones to the batch', async () => {
      const missingIdentifier = 'MISSING-123456';
      esdtService.getEsdtTokenProperties.mockImplementation((tokenIdentifier: string) => tokenIdentifier === identifier ? properties : undefined);
      cachingService.batchApplyAll = jest.fn(async (elements: string[], _keyFunc: any, getter: any, setter: any) => {
        for (const element of elements) {
          const value = await getter(element);
          if (value !== undefined) {
            setter(element, value);
          }
        }
      });
      cachingService.setMany = jest.fn();

      const logs = [identifier, missingIdentifier, missingIdentifier].map(tokenIdentifier => ({
        address: 'erd1',
        events: [{ identifier: 'ESDTTransfer', address: 'erd1', topics: [Buffer.from(tokenIdentifier).toString('base64'), '', 'AQ=='] }],
      }));

      const operations = await service.getOperationsForTransactionLogs('hash', logs as any, 'erd1');

      expect(operations.map(operation => operation.name)).toStrictEqual(['Token', undefined, undefined]);
      expect(cachingService.setMany).toHaveBeenCalledWith([CacheInfo.TokenTransferProperties(missingIdentifier).key], [null], Constants.oneMinute());
      expect(esdtService.getEsdtTokenProperties).toHaveBeenCalledTimes(2);
    });

    it('should not fetch token properties when they are cached', async () => {
      cachingService.getOrSet.mockResolvedValue(null);

      const result = await service.getTokenTransferProperties({ identifier });

      expect(result).toBeNull();
      expect(esdtService.getEsdtTokenProperties).not.toHaveBeenCalled();
      expect(cachingService.set).not.toHaveBeenCalled();
    });
  });

  describe('EsdtService', () => {
    let service: EsdtService;

    beforeEach(() => {
      service = Object.assign(Object.create(EsdtService.prototype), { cachingService });
    });

    it('should cache existing esdt properties for the standard ttl', async () => {
      jest.spyOn(service, 'getEsdtTokenPropertiesRaw').mockResolvedValue(properties as any);

      const result = await service.getEsdtTokenProperties(identifier);

      const { key, ttl } = CacheInfo.EsdtProperties(identifier);

      expect(result).toStrictEqual(properties);
      expect(cachingService.getOrSet).toHaveBeenCalledWith(key, expect.any(Function), ttl, ttl, false);
      expect(cachingService.set).not.toHaveBeenCalled();
    });

    it('should cache missing esdt properties for one minute', async () => {
      jest.spyOn(service, 'getEsdtTokenPropertiesRaw').mockResolvedValue(null);

      const result = await service.getEsdtTokenProperties(identifier);

      expect(result).toBeUndefined();
      expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.EsdtProperties(identifier).key, null, Constants.oneMinute());
    });
  });
});
