
import { VmQueryService } from 'src/endpoints/vm.query/vm.query.service';
import { Queue } from 'src/endpoints/nodes/entities/queue';
import { NodeFilter } from 'src/endpoints/nodes/entities/node.filter';
import { Test } from "@nestjs/testing";
import { CachingService } from "src/common/caching/caching.service";
import { KeybaseState } from "src/common/keybase/entities/keybase.state";
import { Node } from "src/endpoints/nodes/entities/node";
import { NodeService } from "src/endpoints/nodes/node.service";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { AccountService } from "../../endpoints/accounts/account.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { PublicAppModule } from "src/public.app.module";
import { NodeType } from 'src/endpoints/nodes/entities/node.type';
import { NodeStatus } from 'src/endpoints/nodes/entities/node.status';
import { NodeSort } from 'src/endpoints/nodes/entities/node.sort';
import '../../utils/extensions/array.extensions';
import '../../utils/extensions/jest.extensions';
import '../../utils/extensions/number.extensions';
import { FileUtils } from "src/utils/file.utils";

describe('Node Service', () => {
  let nodeService: NodeService;
  let cachingService: CachingService;
  let providerService: ProviderService;
  let nodes: Node[];
  let providers: Provider[];
  let accountService: AccountService;
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

    const accounts = await accountService.getAccounts({ from: 0, size: 1 });
    expect(accounts).toHaveLength(1);


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
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe("getNode", () => {
    it("should return node details based on bls identifier", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const bls: string = "003ba6237f0f7c269eebfecb6a0a0796076c02593846e1ce89aee9b832b94dd54e93d35b03dc3d5944b1aae916722506faf959a47cabf2d00f567ad50b10f8f1a40ab0316fdf302454f7aea58b23109ccfdce082bd16fb262342a1382b802c10";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const resuls = await nodeService.getNode(bls);

      expect(resuls).toEqual(
        expect.objectContaining({
          bls: "003ba6237f0f7c269eebfecb6a0a0796076c02593846e1ce89aee9b832b94dd54e93d35b03dc3d5944b1aae916722506faf959a47cabf2d00f567ad50b10f8f1a40ab0316fdf302454f7aea58b23109ccfdce082bd16fb262342a1382b802c10",
          name: "Raven2",
        }));
    });
  });

  describe("getNodeCount", () => {
    it("should return total online nodes count", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      nodes.online = true;
      const online = await nodeService.getNodeCount(nodes);
      expect(online).toStrictEqual(97);

      nodes.online = false;
      const offline = await nodeService.getNodeCount(nodes);
      expect(offline).toStrictEqual(2);
    });

    it("should return total nodes on shard 1", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();
      nodes.shard = 1;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodeCount(nodes);
      expect(results).toStrictEqual(25);
    });

    it("should return total validators nodes count", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();
      nodes.type = NodeType.validator;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodeCount(nodes);
      expect(results).toStrictEqual(97);
    });

    it("should return total observers nodes count", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();
      nodes.type = NodeType.observer;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodeCount(nodes);
      expect(results).toStrictEqual(2);
    });

    it("should return total count of nodes with issues", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();
      nodes.issues = true;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodeCount(nodes);
      expect(results).toStrictEqual(11);
    });
  });

  describe("getNodeVersions", () => {
    it("should return all nodes version", async () => {
      const nodeVersion = await nodeService.getNodeVersions();
      const nodeVersionRaw = await nodeService.getNodeVersionsRaw();

      const versions = Object.values(nodeVersion);
      const versionSum = versions.sum();

      const versionsRaw = Object.values(nodeVersionRaw);
      const versionSumRaw = versionsRaw.sum();

      expect(versionSum).toStrictEqual(1);
      expect(versionSumRaw).toStrictEqual(1);
    });
  });

  describe("getNodes", () => {
    it("should return one list of 3 nodes", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodes({ from: 0, size: 3 }, new NodeFilter());

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identity: "thepalmtreenw" }),
          expect.objectContaining({ identity: "stewiegriffin" }),
          expect.objectContaining({ identity: "heliosstaking" }),
        ])
      );
    });

    it("should return 3 nodes with type validator", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();
      nodes.type = NodeType.validator;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodes({ from: 0, size: 3 }, nodes);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identity: "thepalmtreenw", type: "validator" }),
          expect.objectContaining({ identity: "stewiegriffin", type: "validator" }),
          expect.objectContaining({ identity: "heliosstaking", type: "validator" }),
        ])
      );
    });

    it("should return 3 nodes with status eligible", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();
      nodes.status = NodeStatus.eligible;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodes({ from: 0, size: 3 }, nodes);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identity: "thepalmtreenw", status: "eligible" }),
          expect.objectContaining({ identity: "validblocks", status: "eligible" }),
          expect.objectContaining({ identity: "justminingfr", status: "eligible" }),
        ])
      );
    });

    it("should return 3 nodes from shard 1", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();
      nodes.shard = 1;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodes({ from: 0, size: 3 }, nodes);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identity: "thepalmtreenw", shard: 1 }),
          expect.objectContaining({ identity: "stewiegriffin", shard: 1 }),
          expect.objectContaining({ identity: "heliosstaking", shard: 1 }),
        ])
      );
    });

    it("should return 1 node with issues", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();
      nodes.issues = true;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodes({ from: 0, size: 1 }, nodes);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identity: "oxsy", issues: ['versionMismatch'] }),
        ])
      );
    });

    it("should return 1 node with owner", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();
      nodes.owner = "erd1qzwd98g6xjs6h33ezxc9ey766ee082z9q4yvj46r8p7xqnl0eenqvxtaz3";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodes({ from: 0, size: 1 }, nodes);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identity: "stewiegriffin", owner: "erd1qzwd98g6xjs6h33ezxc9ey766ee082z9q4yvj46r8p7xqnl0eenqvxtaz3" }),
        ])
      );
    });

    it("should return 4 nodes sorted by name ASC", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();
      nodes.sort = NodeSort.name;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodes({ from: 0, size: 4 }, nodes);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "alchemy-pot-12" }),
          expect.objectContaining({ name: "arcstake-EGLD1-141-1" }),
          expect.objectContaining({ name: "Beany-2a" }),
          expect.objectContaining({ name: "binance-validator-19" }),
        ])
      );
    });

    it("should return 2 nodes of a provider ", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const nodes: NodeFilter = new NodeFilter();
      nodes.provider = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getNodes({ from: 0, size: 2 }, nodes);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "ThePalmTreeNW122", provider: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5" }),
          expect.objectContaining({ name: "ThePalmTreeNW312", provider: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5" }),
        ])
      );
    });
  });

  describe("getAllNodes", () => {
    it("should return all nodes", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getAllNodes();

      expect(results.length).toBeGreaterThanOrEqual(99);
    });
  });

  describe("getAllNodesRaw", () => {
    it("should return all raw nodes", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();

      jest
        .spyOn(NodeService.prototype, 'getHeartbeat')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getAllNodesRaw();

      expect(results.length).toBeGreaterThanOrEqual(99);
    });
  });

  describe("getHeartbeat", () => {
    it("should return heartbeat details", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.getHeartbeat();

      for (const result of results) {
        expect(result).toHaveProperties([
          'bls', 'name', 'version', 'identity', 'rating',
          'tempRating', 'ratingModifier', 'shard', 'type', 'status',
          'online', 'nonce', 'instances', 'owner', 'provider',
          'validatorFailure', 'validatorIgnoredSignatures', 'issues', 'position']);
      }
    });
  });

  describe("getQueue", () => {
    it("should return all nodes in queue", async () => {
      const results = await nodeService.getQueue();

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new Queue()));
      }
    });

    it("should return empty array because test simulates that vm query send an empty array with no informations about nodes", async () => {

      jest
        .spyOn(VmQueryService.prototype, 'vmQuery')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => []));

      const results = await nodeService.getQueue();

      expect(results).toStrictEqual([]);
    });
  });

  describe("getBlsOwner", () => {
    it("should return owner address based on bls", async () => {
      const bls: string = "003ba6237f0f7c269eebfecb6a0a0796076c02593846e1ce89aee9b832b94dd54e93d35b03dc3d5944b1aae916722506faf959a47cabf2d00f567ad50b10f8f1a40ab0316fdf302454f7aea58b23109ccfdce082bd16fb262342a1382b802c10";

      jest
        .spyOn(VmQueryService.prototype, 'vmQuery')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => ["AJzSnRo0oavGORGwXJPa1nLzqEUFSMlXQzh8YE/vzmY="]));

      const results = await nodeService.getBlsOwner(bls);

      expect(results).toStrictEqual("erd1qzwd98g6xjs6h33ezxc9ey766ee082z9q4yvj46r8p7xqnl0eenqvxtaz3");
    });
  });

  describe("getOwnerBlses", () => {
    it("should return one bls node details for a specific owner", async () => {
      const owner: string = "erd1qzwd98g6xjs6h33ezxc9ey766ee082z9q4yvj46r8p7xqnl0eenqvxtaz3";

      jest
        .spyOn(VmQueryService.prototype, 'vmQuery')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => ["009cd29d1a34a1abc63911b05c93dad672f3a8450548c95743387c604fefce66]"]));

      const results = await nodeService.getOwnerBlses(owner);

      expect(results).toEqual(expect.arrayContaining([
        "d34f5c776f5dd5adf86b569b73adfdd756f4e5cf7775a77aef67f76bce39d39e3c73de7be37dfcedceb4e1f79f71eeba",
      ]));
    });
  });

  describe("deleteOwnersForAddressInCache", () => {
    it("should delete owners for a specific address in cache", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const address: string = "erd1qzwd98g6xjs6h33ezxc9ey766ee082z9q4yvj46r8p7xqnl0eenqvxtaz3";

      jest
        .spyOn(NodeService.prototype, 'getAllNodes')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}nodes.mock.json`)));

      const results = await nodeService.deleteOwnersForAddressInCache(address);

      expect(results).toEqual(expect.arrayContaining([
        "owner:613:003ba6237f0f7c269eebfecb6a0a0796076c02593846e1ce89aee9b832b94dd54e93d35b03dc3d5944b1aae916722506faf959a47cabf2d00f567ad50b10f8f1a40ab0316fdf302454f7aea58b23109ccfdce082bd16fb262342a1382b802c10",
      ]));
    });
  });

  describe("getOwners", () => {
    it("should return owners address based on bls list", async () => {
      const bls: string[] = [
        "003ba6237f0f7c269eebfecb6a0a0796076c02593846e1ce89aee9b832b94dd54e93d35b03dc3d5944b1aae916722506faf959a47cabf2d00f567ad50b10f8f1a40ab0316fdf302454f7aea58b23109ccfdce082bd16fb262342a1382b802c10",
        "00198be6aae517a382944cd5a97845857f3b122bb1edf1588d60ed421d32d16ea2767f359a0d714fae3a35c1b0cf4e1141d701d5d1d24160e49eeaebeab21e2f89a2b7c44f3a313383d542e69800cfb6e115406d3d8114b4044ef5a04acf0408"];

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          [
            'erd1qzwd98g6xjs6h33ezxc9ey766ee082z9q4yvj46r8p7xqnl0eenqvxtaz3',
            'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5',
          ]));

      const results = await nodeService.getOwners(bls, 608);

      expect(results).toEqual(expect.arrayContaining([
        "erd1qzwd98g6xjs6h33ezxc9ey766ee082z9q4yvj46r8p7xqnl0eenqvxtaz3",
        "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5",
      ]));
    });
  });
});
