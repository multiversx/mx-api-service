import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { BlockService } from "src/endpoints/blocks/block.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { StakeService } from "src/endpoints/stake/stake.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { CacheInfo } from "src/utils/cache.info";
import { NodeFilter } from "src/endpoints/nodes/entities/node.filter";
import { NodeStatus } from "src/endpoints/nodes/entities/node.status";
import { NodeType } from "src/endpoints/nodes/entities/node.type";
import { QueryPagination } from "src/common/entities/query.pagination";
import { NodeSort } from "src/endpoints/nodes/entities/node.sort";
import { KeysService } from "src/endpoints/keys/keys.service";
import * as fs from 'fs';
import * as path from 'path';

describe('NodeService', () => {
  let nodeService: NodeService;
  let cacheService: CacheService;
  let vmQueryService: VmQueryService;
  let apiConfigService: ApiConfigService;
  let gatewayService: GatewayService;

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
            getNodeWaitingEpochsLeft: jest.fn(),
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
            isNodeEpochsLeftEnabled: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
            batchSet: jest.fn(),
            getLocal: jest.fn(),
            deleteInCache: jest.fn(),
            batchGetManyRemote: jest.fn(),
          },
        },
        {
          provide: StakeService,
          useValue: {
            getStakes: jest.fn(),
            getMinimumAuctionStake: jest.fn(),
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
        {
          provide: KeysService,
          useValue: {
            getKeyUnbondPeriod: jest.fn(),
          },
        },

      ],
    }).compile();

    nodeService = moduleRef.get<NodeService>(NodeService);
    cacheService = moduleRef.get<CacheService>(CacheService);
    vmQueryService = moduleRef.get<VmQueryService>(VmQueryService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
    gatewayService = moduleRef.get<GatewayService>(GatewayService);
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
        const cacheSpy = jest.spyOn(nodeService['cacheService'], 'getOrSet').mockImplementation(async (key, getter) => {
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
        const cacheSpy = jest.spyOn(nodeService['cacheService'], 'getOrSet').mockImplementation(async (key, getter) => {
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
        jest.spyOn(nodeService['cacheService'], 'getOrSet').mockImplementation(async (key, getter) => {
          if (key === CacheInfo.Nodes.key) {
            return mockNodes;
          }
          return getter();
        });

        const result = await nodeService.getNode(bls);
        expect(result).toStrictEqual(expectedNode);
      });

      it('should return epochsLeft key from gateway for a specific node', async () => {
        const bls = "72043abcbb6c3f472c3f486eb181794eeb11c70df5cdbb2c12eb16b92ec0dea12dfae0762641d92bf9a1c8743156f008f19a6a1b5160ace7c304390133c47a54399def909a7caeb59b9534002e7de7140d3241cce1a857f6c733dcfa80a1f28e";

        jest.spyOn(apiConfigService, 'isNodeEpochsLeftEnabled').mockReturnValue(true);
        // eslint-disable-next-line require-await
        jest.spyOn(nodeService['cacheService'], 'getOrSet').mockImplementation(async (key, getter) => {
          if (key === CacheInfo.Nodes.key) {
            return mockNodes;
          }
          return getter();
        });

        jest.spyOn(nodeService, 'getAllNodes').mockResolvedValue(mockNodes);
        jest.spyOn(gatewayService, 'getNodeWaitingEpochsLeft').mockResolvedValue(10);

        const result = await nodeService.getNode(bls);

        expect(result).toEqual(expect.objectContaining({ epochsLeft: 10 }));
      });
    });

    describe('getNodeCount', () => {
      it('returns the correct count of nodes without NodeFilter applied', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const result = await nodeService.getNodeCount(new NodeFilter());

        expect(result).toStrictEqual(100);
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

        expect(result).toStrictEqual(98);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });

      it('should return the correct count of nodes with status online', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const result = await nodeService.getNodeCount(new NodeFilter({ online: true }));

        expect(result).toStrictEqual(98);
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

        expect(result).toStrictEqual(3);
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
        const cacheSpy = jest.spyOn(nodeService['cacheService'], 'getOrSet').mockImplementation(async (key, getter) => {
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
          'v1.2.38.0': 0.8878,
          'v1.2.39.0': 0.1122,
        };
        const result = await nodeService.getNodeVersionsRaw();
        expect(result).toStrictEqual(expectedVersions);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('getNodes', () => {
      it('should return an array of nodes and not filtered', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const results = await nodeService.getNodes(new QueryPagination(), new NodeFilter());

        expect(results.length).toStrictEqual(25);
        expect(allNodesSpy).toHaveBeenCalled();
      });

      it('should return an array of with one node and not filtered', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const results = await nodeService.getNodes(new QueryPagination({ size: 1 }), new NodeFilter());

        expect(results.length).toStrictEqual(1);
        expect(allNodesSpy).toHaveBeenCalled();
      });

      it('should return an array of nodes sorted by name ', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const results = await nodeService.getNodes(new QueryPagination({ size: 5 }), new NodeFilter({ sort: NodeSort.name }));
        const sortedMockNodes = results.sort((a: any, b: any) => a.name.localeCompare(b.name));

        expect(results).toEqual(sortedMockNodes);
        expect(allNodesSpy).toHaveBeenCalled();
      });

      it('should return an array of nodes sorted by locked value ', async () => {
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const results = await nodeService.getNodes(new QueryPagination({ size: 5 }), new NodeFilter({ sort: NodeSort.locked }));

        for (const result of results) {
          expect(result.locked).toStrictEqual('2500000000000000000000');
        }
        expect(allNodesSpy).toHaveBeenCalled();
      });
    });

    describe('deleteOwnersForAddressInCache', () => {
      it('should return an empty array if no cache entries are found for an address', async () => {
        const address = 'erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx';
        const allNodesSpy = jest.spyOn(nodeService, 'getAllNodes').mockResolvedValueOnce(Promise.resolve(mockNodes));
        const currentEpochSpy = jest.spyOn(nodeService['blockService'], 'getCurrentEpoch').mockResolvedValue(1);

        jest.spyOn(nodeService['cacheService'], 'deleteInCache').mockResolvedValue([]);

        const result = await nodeService.deleteOwnersForAddressInCache(address);

        expect(result).toEqual([]);
        expect(currentEpochSpy).toHaveBeenCalledTimes(1);
        expect(allNodesSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('getOwners', () => {
      it('should return cached values if all are present', async () => {
        const blses = [
          '00198be6aae517a382944cd5a97845857f3b122bb1edf1588d60ed421d32d16ea2767f359a0d714fae3a35c1b0cf4e1141d701d5d1d24160e49eeaebeab21e2f89a2b7c44f3a313383d542e69800cfb6e115406d3d8114b4044ef5a04acf0408',
          '003ba6237f0f7c269eebfecb6a0a0796076c02593846e1ce89aee9b832b94dd54e93d35b03dc3d5944b1aae916722506faf959a47cabf2d00f567ad50b10f8f1a40ab0316fdf302454f7aea58b23109ccfdce082bd16fb262342a1382b802c10'];
        const epoch = 10;
        const keys = blses.map((bls) => CacheInfo.OwnerByEpochAndBls(epoch, bls).key);
        const values = ['erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5', 'erd1qzwd98g6xjs6h33ezxc9ey766ee082z9q4yvj46r8p7xqnl0eenqvxtaz3'];
        const barchGetManyRemoteSpy = jest.spyOn(nodeService['cacheService'], 'batchGetManyRemote').mockResolvedValue(values);

        const result = await nodeService.getOwners(blses, epoch);

        expect(result).toEqual(values);
        expect(barchGetManyRemoteSpy).toHaveBeenCalledWith(keys);
        expect(cacheService.batchSet).not.toHaveBeenCalled();
      });

      it('should query missing values and cache them', async () => {
        const epoch = 123;
        const cached = ['erd1kz2kumr0clug4ht2ek0l4l9drvq3rne9lmkwrjf3qv2luyuuaj2szjwv0f', null, 'erd1qzwd98g6xjs6h33ezxc9ey766ee082z9q4yvj46r8p7xqnl0eenqvxtaz3', null];
        const existingBlses: string[] =
          ['00198be6aae517a382944cd5a97845857f3b122bb1edf1588d60ed421d32d16ea2767f359a0d714fae3a35c1b0cf4e1141d701d5d1d24160e49eeaebeab21e2f89a2b7c44f3a313383d542e69800cfb6e115406d3d8114b4044ef5a04acf0408',
            '003ba6237f0f7c269eebfecb6a0a0796076c02593846e1ce89aee9b832b94dd54e93d35b03dc3d5944b1aae916722506faf959a47cabf2d00f567ad50b10f8f1a40ab0316fdf302454f7aea58b23109ccfdce082bd16fb262342a1382b802c10',
            '0076f4031a3ac22bc8bd83e12708d4f360a3f5d2734b05496ab0d5cf31fd867522e156ad30b8bfd245a445f0cca69712562b12139399bb9214c7efe4baf31cc311fe16c88bf2373d82527a8795c17df58ef938d0e324d050f1243ecfaea10914',
            '00980fb53ef5a585695931781d34034533638ad1d814aa4c4926d0ced17f2935d328dd4415f44fb868e920da12ece704a2185d254c5275abfac8620da97ebebaed0c2040364b0c6f60d44891e77c20346f7ebebf08181cedc82a0b517a4e5d99'];

        const currentEpochSpy = jest.spyOn(nodeService['blockService'], 'getCurrentEpoch').mockResolvedValue(epoch);

        jest.spyOn(nodeService['cacheService'], 'batchGetManyRemote').mockResolvedValue(cached);
        jest.spyOn(nodeService, 'getOwnerBlses').mockResolvedValue(existingBlses);
        jest.spyOn(nodeService['apiConfigService'], 'getIsFastWarmerCronActive').mockReturnValue(false);

        const result = await nodeService.getOwners(existingBlses, epoch);
        expect(result).toStrictEqual(
          [
            'erd1kz2kumr0clug4ht2ek0l4l9drvq3rne9lmkwrjf3qv2luyuuaj2szjwv0f',
            undefined,
            'erd1qzwd98g6xjs6h33ezxc9ey766ee082z9q4yvj46r8p7xqnl0eenqvxtaz3',
            undefined,
          ]
        );
        expect(currentEpochSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('getOwnerBlses', () => {
      it('should return empty array if getBlsKeysStatusListEncoded is returning []', async () => {
        const address = 'erd1kz2kumr0clug4ht2ek0l4l9drvq3rne9lmkwrjf3qv2luyuuaj2szjwv0f';

        jest.spyOn(apiConfigService, 'getAuctionContractAddress').mockReturnValue('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l');
        jest.spyOn(nodeService['vmQueryService'], 'vmQuery').mockResolvedValueOnce([]);

        const result = await nodeService.getOwnerBlses(address);

        expect(result).toEqual([]);
        expect(vmQueryService.vmQuery).toHaveBeenCalled();
      });

      it('should return an array of BLS keys', async () => {
        const address = 'erd1kz2kumr0clug4ht2ek0l4l9drvq3rne9lmkwrjf3qv2luyuuaj2szjwv0f';
        const expectedBls = ["00198be6aae517a382944cd5a97845857f3b122bb1edf1588d60ed421d32d16ea2767f359a0d714fae3a35c1b0cf4e1141d701d5d1d24160e49eeaebeab21e2f89a2b7c44f3a313383d542e69800cfb6e115406d3d8114b4044ef5a04acf0408"];
        const getBlsKeysStatusListEncoded = [
          'ABmL5qrlF6OClEzVqXhFhX87Eiux7fFYjWDtQh0y0W6idn81mg1xT646NcGwz04RQdcB1dHSQWDknurr6rIeL4mit8RPOjEzg9VC5pgAz7bhFUBtPYEUtARO9aBKzwQI',
          'ADumI38PfCae6/7LagoHlgdsAlk4RuHOia7puDK5TdVOk9NbA9w9WUSxqukWciUG+vlZpHyr8tAPVnrVCxD48aQKsDFv3zAkVPeupYsjEJzP3OCCvRb7JiNCoTgrgCwQ',
        ];

        jest.spyOn(apiConfigService, 'getAuctionContractAddress').mockReturnValue('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l');
        jest.spyOn(nodeService['vmQueryService'], 'vmQuery').mockResolvedValueOnce(getBlsKeysStatusListEncoded);

        const result = await nodeService.getOwnerBlses(address);

        expect(vmQueryService.vmQuery).toHaveBeenCalled();
        expect(result).toStrictEqual(expectedBls);
      });
    });
  });
});
