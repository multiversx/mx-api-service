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

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));
    }
  });

  beforeEach(() => { jest.restoreAllMocks(); });

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

    it("should return nodes of a specific owner", async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.owner = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const filteredNodes = await nodeService.getNodes({ from: 0, size: 25 }, nodeFilter);

      for (const node of filteredNodes) {
        console.log(node);
      }

    });

    it("node is validator only if stake is equal with 2500 EGLD", async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.type = NodeType.validator;

      const filteredNodes = await nodeService.getNodes({ from: 0, size: 1 }, nodeFilter);
      for (const node of filteredNodes) {
        if (node.stake === "2500000000000000000000") {
          expect(node.type).toStrictEqual(NodeType.validator);
        }
      }
    });

    it('should have observer type', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.type = NodeType.observer;
      const filteredNodes = await nodeService.getNodes({ from: 0, size: 25 }, nodeFilter);

      for (const node of filteredNodes) {
        expect(node.type).toStrictEqual(NodeType.observer);
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

    it("should be sorted by shard 1", async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.shard = 1;

      const filteredNode = await nodeService.getNodes({ from: 0, size: 1 }, nodeFilter);

      for (const node of filteredNode) {
        expect(node).toBeInstanceOf(Object);
        expect(node.shard).toStrictEqual(1);
      }
    });

    it("should return nodes details if issues filter is true", async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.issues = true;

      const filteredNode = await nodeService.getNodes({ from: 0, size: 1 }, nodeFilter);

      for (const node of filteredNode) {
        expect(node.hasOwnProperty("bls")).toBeTruthy();
        expect(node.hasOwnProperty("name")).toBeTruthy();
        expect(node.hasOwnProperty("version")).toBeTruthy();
        expect(node.hasOwnProperty("identity")).toBeTruthy();
        expect(node.hasOwnProperty("shard")).toBeTruthy();
        expect(node.hasOwnProperty("type")).toBeTruthy();
        expect(node.hasOwnProperty("issues")).toBeTruthy();
        expect(node.hasOwnProperty("validatorFailure")).toBeTruthy();
        expect(node.hasOwnProperty("validatorIgnoredSignatures")).toBeTruthy();
      }
    });

    it("should return nodes details if issues filter is false", async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.issues = false;

      const filteredNode = await nodeService.getNodes({ from: 0, size: 1 }, nodeFilter);

      for (const node of filteredNode) {
        expect(node.issues).toBeUndefined();
      }
    });

    it("should be sorted by identity and provider", async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.identity = "thepalmtreenw";
      nodeFilter.provider = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5";

      const filteredNode = await nodeService.getNodes({ from: 0, size: 1 }, nodeFilter);

      for (const node of filteredNode) {
        expect(node.type).toStrictEqual(NodeType.validator);
        expect(node.provider).toStrictEqual("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5");
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
      expect(typeof count).toStrictEqual('number');
    });

    it("should return node count based on provider filter", async () => {
      const provider: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
      const filter = new NodeFilter();
      filter.provider = provider;
      const count = await nodeService.getNodeCount(filter);

      expect(typeof count).toStrictEqual('number');
    });

    it("should return node count based on issue = true filter", async () => {
      const filter = new NodeFilter();
      filter.issues = true;
      const count = await nodeService.getNodeCount(filter);

      expect(typeof count).toStrictEqual('number');
    });

    it("should return node count based on issue = false filter", async () => {
      const filter = new NodeFilter();
      filter.issues = false;
      const count = await nodeService.getNodeCount(filter);

      expect(typeof count).toStrictEqual('number');
    });

    it("should return node count based on status = eligible filter", async () => {
      const filter = new NodeFilter();
      filter.status = NodeStatus.eligible;
      const count = await nodeService.getNodeCount(filter);

      expect(typeof count).toStrictEqual('number');
    });

    it("should return node count based on status = queued filter", async () => {
      const filter = new NodeFilter();
      filter.status = NodeStatus.queued;
      const count = await nodeService.getNodeCount(filter);

      expect(typeof count).toStrictEqual('number');
    });

    it("should return node count based on status = new filter", async () => {
      const filter = new NodeFilter();
      filter.status = NodeStatus.new;
      const count = await nodeService.getNodeCount(filter);

      expect(typeof count).toStrictEqual('number');
    });

    it("should return node count based on type = validator filter", async () => {
      const filter = new NodeFilter();
      filter.type = NodeType.validator;
      const count = await nodeService.getNodeCount(filter);

      expect(typeof count).toStrictEqual('number');
    });

    it("should return node count based on type = observer filter", async () => {
      const filter = new NodeFilter();
      filter.type = NodeType.observer;
      const count = await nodeService.getNodeCount(filter);

      expect(typeof count).toStrictEqual('number');
    });

    it("should return node count based on only = true filter", async () => {
      const filter = new NodeFilter();
      filter.online = true;
      const count = await nodeService.getNodeCount(filter);

      expect(typeof count).toStrictEqual('number');
    });

    it("should return node count based on only = false filter", async () => {
      const filter = new NodeFilter();
      filter.online = false;
      const count = await nodeService.getNodeCount(filter);

      expect(typeof count).toStrictEqual('number');
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

  describe("getOwners", () => {
    it("should return nodes address", async () => {
      const bls: string[] = [
        "011176971aa7bbc6bf849d85d8512d4ab5fc9c9af4a6cab2cf502b419f568a3beaebf3347934eb341731591ffd41980977b6a20a896438236eb215ab5ff56093421bb824211f0a2cc71fda67473fa72306a6d04dd04e054cacb2bffe4ef5a309",
        "003ba6237f0f7c269eebfecb6a0a0796076c02593846e1ce89aee9b832b94dd54e93d35b03dc3d5944b1aae916722506faf959a47cabf2d00f567ad50b10f8f1a40ab0316fdf302454f7aea58b23109ccfdce082bd16fb262342a1382b802c10",
      ];
      const results = await nodeService.getOwners(bls, 573);

      expect(results[0]).toStrictEqual("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat");
      expect(results[1]).toStrictEqual("erd1qzwd98g6xjs6h33ezxc9ey766ee082z9q4yvj46r8p7xqnl0eenqvxtaz3");
    });
  });

  describe("getAllNodesRaw", () => {
    it("should return all nodes", async () => {
      const nodes = await nodeService.getAllNodesRaw();

      for (const node of nodes) {
        expect(node).toBeInstanceOf(Object);
      }
    });
  });
});
