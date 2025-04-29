import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { QueryPagination } from "src/common/entities/query.pagination";
import { IndexerService } from "src/common/indexer/indexer.service";
import { BlockService } from "src/endpoints/blocks/block.service";
import { Block } from "src/endpoints/blocks/entities/block";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { BlsService } from "src/endpoints/bls/bls.service";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { CacheInfo } from "src/utils/cache.info";
import { BlockProofDto } from "../../../endpoints/blocks/entities/block.proof";
import { ApiConfigService } from "../../../common/api-config/api.config.service";

describe('Block Service', () => {
  let blockService: BlockService;
  let indexerService: IndexerService;
  let cacheService: CacheService;
  let blsService: BlsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        BlockService,
        {
          provide: IndexerService,
          useValue: {
            getBlocksCount: jest.fn(),
            getBlocks: jest.fn(),
            getBlock: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
            setLocal: jest.fn(),
            getLocal: jest.fn(),
            getCacheLocal: jest.fn(),
            setCacheLocal: jest.fn(),
          },
        },
        {
          provide: BlsService,
          useValue: {
            getPublicKeys: jest.fn(),
          },
        },
        {
          provide: NodeService,
          useValue: {
            getAllNodes: jest.fn(),
          },
        },
        {
          provide: IdentitiesService,
          useValue: {
            getIdentity: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            isChainAndromedaEnabled: jest.fn(),
            getChainAndromedaActivationEpoch: jest.fn(),
          },
        },
      ],
    }).compile();

    blockService = moduleRef.get<BlockService>(BlockService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    cacheService = moduleRef.get<CacheService>(CacheService);
    blsService = moduleRef.get<BlsService>(BlsService);
  });

  describe('getBlocksCount', () => {
    it('should return the cached value when filter is undefined', async () => {
      const expectedCount = 100;
      jest.spyOn(cacheService, 'getOrSet').mockImplementationOnce(async (_key: string, promise: any) => {
        const result = await promise();
        expect(result).toEqual(expectedCount);
        return result;
      });

      jest.spyOn(indexerService, 'getBlocksCount').mockResolvedValueOnce(expectedCount);

      const result = await blockService.getBlocksCount({});
      expect(indexerService.getBlocksCount).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedCount);
    });

    it('should call indexerService.getBlocksCount when filter is defined', async () => {
      const expectedCount = 100;
      const filter: BlockFilter = { epoch: 123, shard: 0 };
      jest.spyOn(cacheService, 'getOrSet').mockImplementationOnce(async (_key: string, promise: any) => {
        const result = await promise();
        expect(result).toEqual(expectedCount);
        return result;
      });

      jest.spyOn(indexerService, 'getBlocksCount').mockResolvedValueOnce(expectedCount);

      const result = await blockService.getBlocksCount(filter);

      expect(indexerService.getBlocksCount).toHaveBeenCalledWith(filter);
      expect(result).toEqual(expectedCount);
    });
  });

  describe('getBlocks', () => {
    it('should return an empty array when the indexer returns an empty array', async () => {
      jest.spyOn(indexerService, 'getBlocks').mockResolvedValueOnce([]);
      const result = await blockService.getBlocks({ shard: 0, epoch: 123 }, { from: 0, size: 10 });
      expect(result).toEqual([]);
    });
  });

  describe('getLatestBlock', () => {
    const block: Block = {
      hash: '99fcd63076e5f561501666d0d31cbe0b7fa8437167b767dc27f954834a65a50a',
      epoch: 1000,
      nonce: 14553815,
      prevHash: '5b5528f1c8266af2cd73ff178ac7fdedf267f8f09df8d45f7dc0c537bbb9827a',
      proposer: 'e67efa88f663f16cbac406b2aee2784b24ab319ec633451b1963c575187d66089d56c505f9cb3b492ae2a9fe4b61e000a88b745b66543f913fd53b4b33eb5861b89ffea54c29d97665aa5f627ce4387b9f15b2440f35b3babe6d2f3d04572a04',
      proposerIdentity: undefined,
      pubKeyBitmap: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      round: 14574008,
      shard: 4294967295,
      size: 1861,
      sizeTxs: 523,
      stateRootHash: '683c040b7e20e1e26b82b96c9ae7071b58b073022da43e32cc0326fc769d44b6',
      timestamp: 1683561648,
      txCount: 3,
      gasConsumed: 6000000,
      gasRefunded: 4932000,
      gasPenalized: 0,
      maxGasLimit: 15000000000,
      scheduledRootHash: undefined,
      proof: undefined,
      previousHeaderProof: new BlockProofDto({
        pubKeysBitmap: '7702',
        aggregatedSignature: '50224d66a42a019991d16f25dba375b581f279d4394d4c254876c1484f61bed90fb20456f8af107c54e4eed1763e2a92',
        headerHash: '414d526161587ae9f53453aa0392971272c48dbb3cc54a33448972d388e0deeb',
        headerEpoch: 100,
        headerRound: 12500,
        headerNonce: 10500,
      }),
    };

    it('should call cachingService.getOrSet with the correct arguments and return the result', async () => {
      const ttl = 30;

      cacheService.getOrSet = jest.fn().mockResolvedValue(block);

      const result = await blockService.getLatestBlock(ttl);

      expect(result).toEqual(block);
      expect(cacheService.getOrSet).toHaveBeenCalledTimes(1);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        CacheInfo.BlocksLatest(ttl).key,
        expect.any(Function),
        CacheInfo.BlocksLatest(ttl).ttl,
        Math.round(CacheInfo.BlocksLatest(ttl).ttl / 10),
      );
    });

    it('should return the latest block when there are blocks', async () => {
      blockService.getBlocks = jest.fn().mockResolvedValue([block]);

      const result = await blockService.getLatestBlockRaw();

      expect(result).toEqual(block);
      expect(blockService.getBlocks).toHaveBeenCalledTimes(1);
      expect(blockService.getBlocks).toHaveBeenCalledWith(
        new BlockFilter(),
        new QueryPagination({ from: 0, size: 1 }),
      );
    });

    it('should return undefined when there are no blocks', async () => {
      blockService.getBlocks = jest.fn().mockResolvedValue([]);

      const result = await blockService.getLatestBlockRaw();

      expect(result).toBeUndefined();
      expect(blockService.getBlocks).toHaveBeenCalledTimes(1);
      expect(blockService.getBlocks).toHaveBeenCalledWith(
        new BlockFilter(),
        new QueryPagination({ from: 0, size: 1 }),
      );
    });

    it('should return current epoch', async () => {
      blockService.getBlocks = jest.fn().mockResolvedValue([block]);

      const result = await blockService.getCurrentEpoch();

      expect(result).toStrictEqual(1000);
      expect(blockService.getBlocks).toHaveBeenCalledTimes(1);
      expect(blockService.getBlocks).toHaveBeenCalledWith(
        new BlockFilter(),
        new QueryPagination({ from: 0, size: 1 }),
      );
    });

    it('should return -1 because test simulates that getBlocks returns empty array', async () => {
      blockService.getBlocks = jest.fn().mockResolvedValue([]);

      const result = await blockService.getCurrentEpoch();

      expect(result).toStrictEqual(-1);
      expect(blockService.getBlocks).toHaveBeenCalledTimes(1);
      expect(blockService.getBlocks).toHaveBeenCalledWith(
        new BlockFilter(),
        new QueryPagination({ from: 0, size: 1 }),
      );
    });
  });

  describe('computeProposerAndValidators', () => {
    it('should compute proposer and validators correctly', async () => {
      const inputItem = {
        shardId: 1,
        epoch: 2,
        searchOrder: 'desc',
        proposer: 0,
        validators: [1, 2],
      };

      const blses = ['bls_key_0', 'bls_key_1', 'bls_key_2'];

      jest.spyOn(cacheService, 'getLocal').mockImplementation(() => Promise.resolve(blses));
      jest.spyOn(blsService, 'getPublicKeys').mockImplementation(() => Promise.resolve(blses));

      const result = await blockService.computeProposerAndValidators(inputItem);

      expect(result).toEqual({
        shardId: 1,
        epoch: 2,
        validators: [1, 2],
        proposer: 'bls_key_0',
      });
    });

    it('should fetch blses from blsService if not in cache', async () => {
      const inputItem = {
        shardId: 1,
        epoch: 2,
        proposer: 0,
        validators: ['bls_key_1', 'bls_key_2'],
      };

      const blses = ['bls_key_0', 'bls_key_1', 'bls_key_2'];

      jest.spyOn(cacheService, 'getLocal').mockImplementationOnce(() => Promise.resolve(null));
      jest.spyOn(cacheService, 'setLocal').mockImplementation(() => Promise.resolve());
      jest.spyOn(blsService, 'getPublicKeys').mockImplementation(() => Promise.resolve(blses));

      await blockService.computeProposerAndValidators(inputItem);

      expect(blsService.getPublicKeys).toHaveBeenCalledWith(1, 2);
      expect(cacheService.setLocal).toHaveBeenCalled();
    });
  });
});
