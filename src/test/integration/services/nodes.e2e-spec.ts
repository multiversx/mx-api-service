import { ElrondCachingService } from "@multiversx/sdk-nestjs";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { KeybaseService } from "src/common/keybase/keybase.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { BlockService } from "src/endpoints/blocks/block.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { StakeService } from "src/endpoints/stake/stake.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import * as fs from 'fs';
import * as path from 'path';
import { CacheInfo } from "src/utils/cache.info";
import { NodeFilter } from "src/endpoints/nodes/entities/node.filter";
import { NodeStatus } from "src/endpoints/nodes/entities/node.status";
import { NodeType } from "src/endpoints/nodes/entities/node.type";
import { QueryPagination } from "src/common/entities/query.pagination";

describe('NodeService', () => {
  let nodeService: NodeService;
  // let vmQueryService: VmQueryService;
  // let apiConfigService: ApiConfigService;
  // let cachingService: ElrondCachingService;
  // let keybaseService: KeybaseService;
  // let stakeService: StakeService;
  // let providerService: ProviderService;
  // let blockService: BlockService;
  // let protocolService: ProtocolService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NodeService,
        {
          provide: GatewayService,
          useValue: {
            get: jest.fn(),
            getTrieStatistics: jest.fn(),
            getNetworkConfig: jest.fn(),
            getValidatorAuctions: jest.fn(),
            getNodeHeartbeatStatus: jest.fn(),
          },
        },
        {
          provide: VmQueryService,
          useValue: {
            vmQuery: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            isStakingV4Enabled: jest.fn(),
            getIsFastWarmerCronActive: jest.fn(),
            getStakingContractAddress: jest.fn(),
            getAuctionContractAddress: jest.fn(),
            isNodeSyncProgressEnabled: jest.fn(),
          },
        },
        {
          provide: ElrondCachingService,
          useValue: {
            getOrSet: jest.fn(),
            batchSet: jest.fn(),
            deleteInCache: jest.fn(),
            batchGetManyRemote: jest.fn(),
          },
        },
        {
          provide: KeybaseService,
          useValue: {
            getCachedNodesAndProvidersKeybases: jest.fn(),
          },
        },
        {
          provide: StakeService,
          useValue: {
            getStakes: jest.fn(),
          },
        },
        {
          provide: ProviderService,
          useValue: {
            getAllProviders: jest.fn(),
          },
        },
        {
          provide: BlockService,
          useValue: {
            getCurrentEpoch: jest.fn(),
          },
        },
        {
          provide: ProtocolService,
          useValue: {
            getShardIds: jest.fn(),
          },
        },
      ],
    }).compile();

    nodeService = moduleRef.get<NodeService>(NodeService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  it('service should be defined', () => {
    expect(nodeService).toBeDefined();
  });

  describe('Node Service', () => {
    const mockNodes = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/nodes.mock.json'), 'utf-8'));

    describe('getNode', () => {
      const expectedNode = {
        bls: "00198be6aae517a382944cd5a97845857f3b122bb1edf1588d60ed421d32d16ea2767f359a0d714fae3a35c1b0cf4e1141d701d5d1d24160e49eeaebeab21e2f89a2b7c44f3a313383d542e69800cfb6e115406d3d8114b4044ef5a04acf0408",
        name: "ThePalmTreeNW122",
        version: "v1.2.38.0",
        identity: "thepalmtreenw",
        rating: 100,
        tempRating: 100,
        ratingModifier: 1.2,
        shard: 1,
        type: "validator",
        status: "eligible",
        online: true,
        nonce: 8160575,
        instances: 1,
        owner: "erd1kz2kumr0clug4ht2ek0l4l9drvq3rne9lmkwrjf3qv2luyuuaj2szjwv0f",
        provider: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5",
        stake: "2500000000000000000000",
        topUp: "688187259066013399629",
        locked: "3188187259066013399629",
        leaderFailure: 0,
        leaderSuccess: 28,
        validatorFailure: 0,
        validatorIgnoredSignatures: 0,
        validatorSuccess: 1892,
        position: 0,
      };

      it('should return node details for a given bls when data is not available in cache', async () => {
        const bls = "00198be6aae517a382944cd5a97845857f3b122bb1edf1588d60ed421d32d16ea2767f359a0d714fae3a35c1b0cf4e1141d701d5d1d24160e49eeaebeab21e2f89a2b7c44f3a313383d542e69800cfb6e115406d3d8114b4044ef5a04acf0408";

        // eslint-disable-next-line require-await
        const cacheSpy = jest.spyOn(nodeService['cachingService'], 'getOrSet').mockImplementation(async (key, getter) => {
          if (key === CacheInfo.Nodes.key) {
            return mockNodes;
          }
          return getter();
        });

        jest.spyOn(nodeService, 'getAllNodes').mockResolvedValue(mockNodes);
        const result = await nodeService.getNode(bls);

        expect(cacheSpy).toHaveBeenCalledTimes(0);
        expect(result).toStrictEqual(expectedNode);
      });

      it('should return undefined when no node is found', async () => {
        const bls = "nonexistent_bls";

        // eslint-disable-next-line require-await
        const cacheSpy = jest.spyOn(nodeService['cachingService'], 'getOrSet').mockImplementation(async (key, getter) => {
          if (key === CacheInfo.Nodes.key) {
            return mockNodes;
          }
          return getter();
        });

        jest.spyOn(nodeService, 'getAllNodes').mockResolvedValue(mockNodes);
        const result = await nodeService.getNode(bls);

        expect(cacheSpy).toHaveBeenCalledTimes(0);
        expect(result).toStrictEqual(undefined);
      });

      it('should return the correct node when found and when is available from cache', async () => {
        const bls = "00198be6aae517a382944cd5a97845857f3b122bb1edf1588d60ed421d32d16ea2767f359a0d714fae3a35c1b0cf4e1141d701d5d1d24160e49eeaebeab21e2f89a2b7c44f3a313383d542e69800cfb6e115406d3d8114b4044ef5a04acf0408";
        // eslint-disable-next-line require-await
        jest.spyOn(nodeService['cachingService'], 'getOrSet').mockImplementation(async (key, getter) => {
          if (key === CacheInfo.Nodes.key) {
            return mockNodes;
          }
          return getter();
        });

        const result = await nodeService.getNode(bls);
        expect(result).toStrictEqual(expectedNode);
      });
    });

    describe('getNodeCount', () => {
      it('returns the correct count of nodes without NodeFilter applied', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const result = await nodeService.getNodeCount(new NodeFilter());

        expect(result).toStrictEqual(99);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });

      it('should return the correct count of nodes with status eligible', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const result = await nodeService.getNodeCount(new NodeFilter({ status: NodeStatus.eligible }));

        expect(result).toStrictEqual(56);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });

      it('should return the correct count of nodes with type validator', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const result = await nodeService.getNodeCount(new NodeFilter({ type: NodeType.validator }));

        expect(result).toStrictEqual(97);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });

      it('should return the correct count of nodes with status online', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const result = await nodeService.getNodeCount(new NodeFilter({ online: true }));

        expect(result).toStrictEqual(97);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });

      it('should return the correct count of nodes with shard 2', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const result = await nodeService.getNodeCount(new NodeFilter({ shard: 2 }));

        expect(result).toStrictEqual(25);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });

      it('should return the correct count of nodes with issues', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const result = await nodeService.getNodeCount(new NodeFilter({ issues: true }));

        expect(result).toStrictEqual(11);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });

      it('should return the correct count of nodes with identity', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const result = await nodeService.getNodeCount(new NodeFilter({ identity: "thepalmtreenw" }));

        expect(result).toStrictEqual(2);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });

      it('should return the correct count of nodes with owner', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const owner = "erd1kz2kumr0clug4ht2ek0l4l9drvq3rne9lmkwrjf3qv2luyuuaj2szjwv0f";
        const result = await nodeService.getNodeCount(new NodeFilter({ owner: owner }));

        expect(result).toStrictEqual(2);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });

      it('should return the correct count of nodes with provider', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const provider = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqxlllllsmehg53";
        const result = await nodeService.getNodeCount(new NodeFilter({ provider: provider }));

        expect(result).toStrictEqual(2);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('getNodeVersions', () => {
      it('should return node version cached data when available', async () => {
        const cachedData = {
          "tags": 0.8370,
          "D1.4.15.0": 0.1561,
          "v1.4.15.1": 0.0033,
          "D1.3.50.0": 0.0033,
        };

        // eslint-disable-next-line require-await
        const cacheSpy = jest.spyOn(nodeService['cachingService'], 'getOrSet').mockImplementation(async (key, getter) => {
          if (key === CacheInfo.NodeVersions.key) {
            return cachedData;
          }
          return getter();
        });

        const result = await nodeService.getNodeVersions();

        expect(result).toStrictEqual(cachedData);
        expect(cacheSpy).toHaveBeenCalledTimes(2);
      });

      it('should return node version data when cached data is not available', async () => {
        jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));

        const versions = {
          "tags": 0.8370,
          "D1.4.15.0": 0.1561,
          "v1.4.15.1": 0.0033,
          "D1.3.50.0": 0.0033,
        };

        const result = await nodeService.getNodeVersions();
        expect(result).toStrictEqual(versions);
      });
    });

    describe('getNodeVersionsRaw', () => {
      it('should return an object with node versions and their respective percentages', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));

        const expectedVersions = {
          'v1.2.38.0': 0.8866,
          'v1.2.39.0': 0.1134,
        };
        const result = await nodeService.getNodeVersionsRaw();
        expect(result).toStrictEqual(expectedVersions);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('getNodes', () => {
      it('should return an array of nodes and not filtered', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const result = await nodeService.getNodes(new QueryPagination(), new NodeFilter());

        expect(result.length).toStrictEqual(25);
        expect(allNodesSpy).toHaveBeenCalled();
      });

      it('should return an array of with one node and not filtered', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const result = await nodeService.getNodes(new QueryPagination({ size: 1 }), new NodeFilter());

        expect(result.length).toStrictEqual(1);
        expect(allNodesSpy).toHaveBeenCalled();
      });
    });
  });
});

