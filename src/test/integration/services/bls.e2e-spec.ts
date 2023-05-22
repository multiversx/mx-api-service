import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { IndexerService } from "src/common/indexer/indexer.service";
import { BlsService } from "src/endpoints/bls/bls.service";

describe('BlsService', () => {
  let blsService: BlsService;
  let indexerService: IndexerService;
  let cachingService: CacheService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        BlsService,
        {
          provide: IndexerService,
          useValue: {
            getPublicKeys: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
      ],
    }).compile();

    blsService = moduleRef.get<BlsService>(BlsService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    cachingService = moduleRef.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicKeys', () => {
    it('should return an array of public keys', async () => {
      const shard = 0;
      const epoch = 10;
      const expectedPublicKeys = ['public-key-1', 'public-key-2', 'public-key-3'];
      jest.spyOn(cachingService, 'getOrSet').mockResolvedValue(expectedPublicKeys);

      const result = await blsService.getPublicKeys(shard, epoch);

      expect(result).toEqual(expectedPublicKeys);
    });

    it('should return public keys for a given shard and epoch', async () => {
      const shard = 0;
      const epoch = 10;
      const publicKeys = ['public-key-1', 'public-key-2', 'public-key-3'];
      jest.spyOn(cachingService, 'getOrSet').mockImplementation(async (_key, promise) => await promise());
      jest.spyOn(indexerService, 'getPublicKeys').mockResolvedValue(publicKeys);

      const result = await blsService.getPublicKeys(shard, epoch);

      expect(result).toEqual(publicKeys);
    });
  });

  describe('getBlsIndex', () => {
    it('should return the index of the given BLS key in the list of public keys', async () => {
      const shard = 0;
      const epoch = 10;
      const blsKey = 'public-key-2';
      const publicKeys = ['public-key-1', 'public-key-2', 'public-key-3'];
      jest.spyOn(blsService, 'getPublicKeys').mockResolvedValue(publicKeys);

      const result = await blsService.getBlsIndex(blsKey, shard, epoch);

      expect(result).toBe(1);
    });

    it('should return -1 if BLS key not found', async () => {
      const shard = 0;
      const epoch = 10;
      const blsKey = 'unknown-bls-key';
      const publicKeys = ['public-key-1', 'public-key-2', 'public-key-3'];
      jest.spyOn(blsService, 'getPublicKeys').mockResolvedValue(publicKeys);

      const result = await blsService.getBlsIndex(blsKey, shard, epoch);

      expect(result).toBe(-1);
    });

    it('should return -1 if public keys are not found', async () => {
      const shard = 0;
      const epoch = 10;
      const blsKey = 'public-key-2';
      const publicKeys: string[] = [];
      jest.spyOn(blsService, 'getPublicKeys').mockResolvedValue(publicKeys);

      const result = await blsService.getBlsIndex(blsKey, shard, epoch);

      expect(result).toBe(-1);
    });
  });

  describe('getPublicKeysRaw', () => {
    it('should return empty array if getPublicKeys returns undefined', async () => {
      jest.spyOn(indexerService, 'getPublicKeys').mockResolvedValue(undefined);

      const result = await blsService['getPublicKeysRaw'](0, 1);

      expect(result).toEqual([]);
    });

    it('should return public keys if getPublicKeys returns an array', async () => {
      const publicKeys = ['publicKey1', 'publicKey2'];
      jest.spyOn(indexerService, 'getPublicKeys').mockResolvedValue(publicKeys);

      const result = await blsService['getPublicKeysRaw'](0, 1);

      expect(result).toEqual(publicKeys);
    });
  });
});
