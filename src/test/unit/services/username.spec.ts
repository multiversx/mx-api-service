import { Constants } from "@multiversx/sdk-nestjs-common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test, TestingModule } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { UsernameService } from "src/endpoints/usernames/username.service";
import { UsernameUtils } from "src/endpoints/usernames/username.utils";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { CacheInfo } from "src/utils/cache.info";

describe('UsernameService', () => {
  let service: UsernameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsernameService,
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
        {
          provide: ApiService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getMaiarIdUrl: jest.fn(),
          },
        },
        {
          provide: VmQueryService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UsernameService>(UsernameService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsernameForAddressRaw', () => {
    it('should return username for valid address', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const expectedUsername = 'testuser';

      jest.spyOn(service['apiService'], 'get').mockResolvedValue({
        data: {
          herotag: expectedUsername,
        },
      });

      const result = await service.getUsernameForAddressRaw(address);
      expect(result).toEqual(expectedUsername);
    });

    it('should return null for invalid address', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      jest.spyOn(service['apiService'], 'get').mockRejectedValue(new Error('Invalid address'));
      jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      const result = await service.getUsernameForAddressRaw(address);

      expect(result).toBeNull();
    });

    it('should return null when an error occurs', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz1';
      const expectedError = new Error('Test error');

      const apiServiceSpy = jest.spyOn(service['apiService'], 'get').mockRejectedValue(expectedError);
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      const result = await service.getUsernameForAddressRaw(address);

      expect(apiServiceSpy).toHaveBeenCalledWith(`${service['apiConfigService'].getMaiarIdUrl()}/users/api/v1/users/${address}`, undefined, expect.any(Function));
      expect(loggerErrorSpy).toHaveBeenCalledTimes(2);
      expect(result).toBeNull();
    });
  });

  describe('getUsernameForAddress', () => {
    it('should return cached username if available', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const cachedUsername = 'alice';

      const cachingServiceSpy = jest.spyOn(service['cachingService'], 'getOrSet').mockResolvedValue(cachedUsername);

      const result = await service.getUsernameForAddress(address);
      expect(cachingServiceSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Function), expect.any(Number));
      expect(result).toEqual(cachedUsername);
    });

    it('should return null if getUsernameForAddressRaw fails', async () => {
      const address = 'erd1Invalid';

      const cachingServiceSpy = jest.spyOn(service['cachingService'], 'getOrSet').mockResolvedValue(null);
      jest.spyOn(service, 'getUsernameForAddressRaw').mockRejectedValue(new Error('Failed to get username'));

      const result = await service.getUsernameForAddress(address);
      expect(cachingServiceSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Function), expect.any(Number));
      expect(result).toBeNull();
    });

    it('should return null when getUsernameForAddressRaw returns null', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      const getUsernameForAddressRawMock = jest.spyOn(service as any, 'getUsernameForAddressRaw').mockResolvedValue(null);
      const cachingServiceSpy = jest.spyOn(service['cachingService'], 'getOrSet').mockImplementation((_key, func) => func());

      const result = await service.getUsernameForAddress(address);

      expect(getUsernameForAddressRawMock).toHaveBeenCalledWith(address);
      expect(cachingServiceSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Function), CacheInfo.Username(address).ttl);
      expect(result).toBeNull();
    });
  });

  describe('getAddressForUsername', () => {
    it('should cross-check username when getting address', async () => {
      const username = 'alice';
      const expectedAddress = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      const cachingServiceSpy = jest.spyOn(service['cachingService'], 'getOrSet').mockResolvedValue(expectedAddress);
      jest.spyOn(service as any, 'getAddressForUsernameRaw').mockResolvedValue(expectedAddress);
      jest.spyOn(service, 'getUsernameForAddressRaw').mockResolvedValue(username);

      const result = await service.getAddressForUsername(username);

      expect(cachingServiceSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Function), expect.any(Number));
      expect(result).toEqual(expectedAddress);
    });

    it('should return null if cross-check fails', async () => {
      const username = 'bob';
      const expectedAddress = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz1';

      const cachingServiceSpy = jest.spyOn(service['cachingService'], 'getOrSet').mockResolvedValue(null);
      jest.spyOn(service as any, 'getAddressForUsernameRaw').mockResolvedValue(expectedAddress);
      jest.spyOn(service, 'getUsernameForAddressRaw').mockResolvedValue(null);

      const result = await service.getAddressForUsername(username);

      expect(cachingServiceSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Function), expect.any(Number));
      expect(result).toBeNull();
    });

    it('should return null when getAddressForUsernameRaw returns null', async () => {
      const username = 'randomUser';

      const getAddressForUsernameRawMock = jest.spyOn(service as any, 'getAddressForUsernameRaw').mockResolvedValue(null);
      const getUsernameForAddressRawMock = jest.spyOn(service, 'getUsernameForAddressRaw').mockImplementation(() => { throw new Error('Test error'); });
      const cachingServiceSpy = jest.spyOn(service['cachingService'], 'getOrSet').mockImplementation((_key, func) => func());

      const result = await service.getAddressForUsername(username);

      expect(getAddressForUsernameRawMock).toHaveBeenCalledWith(username);
      expect(getUsernameForAddressRawMock).not.toHaveBeenCalled();
      expect(cachingServiceSpy).toHaveBeenCalledWith(UsernameUtils.normalizeUsername(username), expect.any(Function), Constants.oneWeek());
      expect(result).toBeNull();
    });
  });

  describe('getUsernameRedirectRoute', () => {
    it('should return route with address only when withGuardianInfo is undefined', () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const result = service.getUsernameRedirectRoute(address, undefined);
      expect(result).toStrictEqual(`/accounts/${address}`);
    });

    it('should return route with address only when withGuardianInfo is false', () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const result = service.getUsernameRedirectRoute(address, false);
      expect(result).toStrictEqual(`/accounts/${address}`);
    });

    it('should return route with address and withGuardianInfo when withGuardianInfo is true', () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const result = service.getUsernameRedirectRoute(address, true);
      expect(result).toStrictEqual(`/accounts/${address}?withGuardianInfo=true`);
    });
  });
});
