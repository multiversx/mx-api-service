import { Test } from "@nestjs/testing";
import { CachingService } from "src/common/caching/caching.service";
import { KeybaseState } from "src/common/keybase/entities/keybase.state";
import { Node } from "src/endpoints/nodes/entities/node";
import { NodeFilter } from "src/endpoints/nodes/entities/node.filter";
import { NodeSort } from "src/endpoints/nodes/entities/node.sort";
import { NodeStatus } from "src/endpoints/nodes/entities/node.status";
import { NodeType } from "src/endpoints/nodes/entities/node.type";
import { NodeService } from "src/endpoints/nodes/node.service";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { AccountService } from "../../endpoints/accounts/account.service";
import { Queue } from "src/endpoints/nodes/entities/queue";
import providerAccount from "../data/accounts/provider.account";
import { FileUtils } from "src/utils/file.utils";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import '../../utils/extensions/array.extensions';
import '../../utils/extensions/jest.extensions';
import '../../utils/extensions/number.extensions';
import { PublicAppModule } from "src/public.app.module";

describe('Node Service', () => {
  let nodeService: NodeService;
  let cachingService: CachingService;
  let providerService: ProviderService;
  let nodes: Node[];
  let providers: Provider[];
  let firstNode: Node;
  let accountService: AccountService;
  let accountAddress: string;
  let apiConfigService: ApiConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nodeService = moduleRef.get<NodeService>(NodeService);
    cachingService = moduleRef.get<CachingService>(CachingService);
    providerService = moduleRef.get<ProviderService>(ProviderService);
    accountService = moduleRef.get<AccountService>(AccountService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

    nodes = await nodeService.getAllNodes();
    providers = await providerService.getAllProviders();
    firstNode = nodes[0];

    const accounts = await accountService.getAccounts({ from: 0, size: 1 });
    expect(accounts).toHaveLength(1);

    const account = accounts[0];
    accountAddress = account.address;

    if (apiConfigService.getMockNodes()) {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodesMocked = FileUtils.parseJSONFile(
        `${MOCK_PATH}nodes.mock.json`,
      );
      jest
        .spyOn(NodeService.prototype, 'getAllNodesRaw')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => nodesMocked));

      const heartbeat = FileUtils.parseJSONFile(
        `${MOCK_PATH}heartbeat.mock.json`,
      );
      jest
        .spyOn(NodeService.prototype, 'getHeartbeat')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => heartbeat));

      const queue = FileUtils.parseJSONFile(`${MOCK_PATH}queue.mock.json`);
      jest
        .spyOn(NodeService.prototype, 'getQueue')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => queue));
    }
  });

  describe('Nodes', () => {
    it('should be in sync with keybase confirmations', async () => {
      const nodeKeybases: { [key: string]: KeybaseState } | undefined = await cachingService.getCache('nodeKeybases');
      expect(nodeKeybases).toBeDefined();

      if (nodeKeybases) {
        for (const node of nodes) {
          const nodeProvider = providers.find((provider) => node.provider === provider.provider);
          if (nodeProvider?.identity) {
            expect(node.identity).toStrictEqual(nodeProvider.identity);
          } else if (nodeKeybases[node.bls] && nodeKeybases[node.bls].confirmed) {
            expect(node.identity).toStrictEqual(nodeKeybases[node.bls].identity);
          } else {
            expect(node.identity).toBeUndefined();
          }
        }
      }
    });

    it('should be filtered by bls, name or version', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.search = firstNode.bls;

      let filteredNodes = await nodeService.getNodes({ from: 0, size: 25 }, nodeFilter);
      for (const node of filteredNodes) {
        expect(node.bls).toStrictEqual(firstNode.bls);
      }

      nodeFilter.search = firstNode.version;
      filteredNodes = await nodeService.getNodes({ from: 0, size: 25 }, nodeFilter);

      for (const node of filteredNodes) {
        expect(node.version).toStrictEqual(firstNode.version);
      }
    });

    it('should be filtered by provider and owner', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.provider = firstNode.provider;
      nodeFilter.owner = firstNode.owner;
      const filteredNodes = await nodeService.getNodes({ from: 0, size: 25 }, nodeFilter);

      for (const node of filteredNodes) {
        expect(node.provider).toStrictEqual(firstNode.provider);
        expect(node.owner).toStrictEqual(firstNode.owner);
      }
    });

    it('should have validator type', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.type = NodeType.validator;
      const filteredNodes = await nodeService.getNodes({ from: 0, size: 25 }, nodeFilter);

      for (const node of filteredNodes) {
        expect(node.type).toStrictEqual(NodeType.validator);
      }
    });

    it('all nodes should be online with eligible status', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.status = NodeStatus.eligible;
      nodeFilter.online = true;
      const filteredNodes = await nodeService.getNodes({ from: 0, size: 25 }, nodeFilter);

      for (const node of filteredNodes) {
        expect(node.status).toStrictEqual(NodeStatus.eligible);
        expect(node.online).toStrictEqual(true);
      }
    });

    it('should be sorted in ascending order by tempRating', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.sort = NodeSort.tempRating;

      const filteredNodes = await nodeService.getNodes({ from: 0, size: 25 }, nodeFilter);
      let currentTempRating = 0;

      for (const node of filteredNodes) {
        if (node.tempRating) {
          expect(node.tempRating).toBeGreaterThanOrEqual(currentTempRating);
          currentTempRating = node.tempRating;
        }
      }
    });

    it('should return nodes of size 10', async () => {
      const nodeFilter = new NodeFilter();
      const filteredNode = await nodeService.getNodes({ from: 0, size: 10 }, nodeFilter);

      expect(filteredNode).toHaveLength(10);

      for (const node of filteredNode) {
        expect(node).toBeInstanceOf(Object);
      }
    });
  });

  describe('Get Node Version', () => {
    it('should return node version', async () => {
      const nodeVersion = await nodeService.getNodeVersions();

      const versions = Object.values(nodeVersion);

      const versionSum = versions.sum();
      expect(versionSum).toStrictEqual(1);
    });
  });

  describe('Get All Nodes', () => {
    it('should return nodes array', async () => {
      const nodes = await nodeService.getAllNodes();

      expect(nodes.length).toBeGreaterThanOrEqual(100);

      for (const node of nodes) {
        expect(node).toBeInstanceOf(Object);
      }
    });
  });

  describe('Get Heartbeat', () => {
    it('should return nodes Heartbeat', async () => {
      const nodes = await nodeService.getHeartbeat();

      expect(nodes.length).toBeGreaterThan(50);

      for (const node of nodes) {
        expect(node).toBeInstanceOf(Object);
      }
    });
  });

  describe('Get Queue', () => {
    it('should return Queue[]', async () => {
      const queueItems = await nodeService.getQueue();

      for (const queueItem of queueItems) {
        expect(queueItem).toHaveStructure(Object.keys(new Queue()));
      }
    });
  });

  describe('Get Node Count', () => {
    it('should return node count', async () => {
      const count = await nodeService.getNodeCount(new NodeFilter());
      expect(typeof count).toBe('number');
    });
  });

  describe('Delete Owners For Address In Cache', () => {
    it('should delete address for an owner in cache', async () => {
      // TODO: make sure keys are in cache, then make sure they are deleted afterwards
      const ownerDeleted = await nodeService.deleteOwnersForAddressInCache(accountAddress);

      for (const owner of ownerDeleted) {
        expect(owner).toBeInstanceOf(Array);
      }
    });
  });

  describe('Get Owner BLS', () => {
    it('should return owner bls', async () => {
      const blsOwner = await nodeService.getOwnerBlses(providerAccount.address);
      expect(blsOwner).toEqual(expect.arrayContaining([expect.any(String)]));
    });

    it('should return empty array', async () => {
      const blsOwner = await nodeService.getOwnerBlses(accountAddress);
      expect(blsOwner).toEqual([]);
    });
  });

  describe('Get Node Version Raw', () => {
    it('should return node version', async () => {
      const versionRaw = await nodeService.getNodeVersionsRaw();

      const versions = Object.values(versionRaw);

      const versionSum = versions.sum();
      expect(versionSum).toStrictEqual(1);
    });
  });

  describe('Get Node', () => {
    it('should return nodes based on bls', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.search = firstNode.bls;
      const node = await nodeService.getNode(nodeFilter.search);

      if (!node) {
        throw new Error('Node properties are not defined');
      }

      expect(node).toHaveProperty('bls');
      expect(node).toHaveProperty('name');
      expect(node).toHaveProperty('version');
    });
  });

  describe("getBlsOwner", () => {
    it("should return bls owner", async () => {
      const bls: string = "00f9b676245ecf7bc74e3b644c106cfbbb366ce01a0149c1e50303d22c09bef7600f21f1925753ab994174b9926e9b078c2d1edaf03c221149ea0239722278aa864a1b26f298c29fe546fdb0ee1385243dfe407074e0dfa134c7e6d4197ce110";
      const owner = await nodeService.getBlsOwner(bls);

      expect(owner).toStrictEqual("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85");
    });
  });
});
