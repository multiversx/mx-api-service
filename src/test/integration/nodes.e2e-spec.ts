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
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";
import {AccountService} from "../../endpoints/accounts/account.service";

describe('Node Service', () => {
  let nodeService: NodeService;
  let cachingService: CachingService;
  let providerService: ProviderService;
  let nodes: Node[];
  let providers: Provider[];
  let nodeSentinel: Node;
  let accountService: AccountService;
  let accountAddress: string;

  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nodeService = publicAppModule.get<NodeService>(NodeService);
    cachingService = publicAppModule.get<CachingService>(CachingService);
    providerService = publicAppModule.get<ProviderService>(ProviderService);
    accountService = publicAppModule.get<AccountService>(AccountService);

    nodes = await nodeService.getAllNodes();
    providers = await providerService.getAllProviders();
    nodeSentinel = nodes[0];

    const accounts = await accountService.getAccounts({ from: 0, size: 1 });
    expect(accounts).toHaveLength(1);

    const account = accounts[0];
    accountAddress = account.address;

  }, Constants.oneHour() * 1000);

  describe('Nodes', () => {
    it('all nodes should have bls and type', async () => {
      for (const node of nodes) {
        expect(node).toHaveProperty('bls');
        expect(node).toHaveProperty('type');
      }
    });

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
      nodeFilter.search = nodeSentinel.bls;

      let filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
      for (const node of filteredNodes) {
        expect(node.bls).toStrictEqual(nodeSentinel.bls);
      }

      nodeFilter.search = nodeSentinel.version;
      filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
      for (const node of filteredNodes) {
        expect(node.version).toStrictEqual(nodeSentinel.version);
      }
    });

    it('should be filtered by provider and owner', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.provider = nodeSentinel.provider;
      nodeFilter.owner = nodeSentinel.owner;

      const filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
      for (const node of filteredNodes) {
        expect(node.provider).toStrictEqual(nodeSentinel.provider);
        expect(node.owner).toStrictEqual(nodeSentinel.owner);
      }
    });

    it('should have validator type', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.type = NodeType.validator;

      const filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
      for (const node of filteredNodes) {
        expect(node.type).toStrictEqual(NodeType.validator);
      }
    });

    it('all nodes should be online with eligible status', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.status = NodeStatus.eligible;
      nodeFilter.online = true;

      const filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
      for (const node of filteredNodes) {
        expect(node.status).toStrictEqual(NodeStatus.eligible);
        expect(node.online).toBeTruthy();
      }
    });

    it('should be sorted in ascending order by tempRating', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.sort = NodeSort.tempRating;

      const filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
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
      const filteredSizeNode = await nodeService.getNodes({
        from: 0,
        size: 10
      }, nodeFilter);

      expect(filteredSizeNode).toBeInstanceOf(Array);
      expect(filteredSizeNode).toHaveLength(10);
    });
  });

  describe('Get Node Version', () => {
    it('should return node version', async () => {
      const nodeVersion = await nodeService.getNodeVersions();
      expect(nodeVersion).toBeInstanceOf(Object);
    });
  });

  describe('Get All Nodes Raw', () => {
    it('should return nodes array', async () => {
      const nodesRaw = await nodeService.getAllNodesRaw();
      expect(nodesRaw).toBeInstanceOf(Array);
    });
  });

  describe('Get HeartBeat', () => {
    it('should return  nodes HeartBeat', async () => {
      const heartBeatValue = await nodeService.getHeartbeat();
      expect(heartBeatValue).toBeInstanceOf(Array);
    });
  });

  describe('Get Queue', () => {
    it('should return queue of address', async () => {
      const queueAddress = await nodeService.getQueue();
      expect(queueAddress).toBeInstanceOf(Array);
    });
  });

  describe('Get Node Count', () => {
    it('should return node count', async () => {
      const nodeCount = await nodeService.getNodeCount(new NodeFilter());
      expect(nodeCount).toBeGreaterThanOrEqual(422);
    });
  });

  describe('Get Node Count', () => {
    it('should return node count', async () => {
      const nodeCount = await nodeService.deleteOwnersForAddressInCache(accountAddress);
      expect(nodeCount).toBeInstanceOf(Array);
    });
  });

  describe('Get Owner BLS', () => {
    it('should return owner bls', async () => {
      const blsOwner = await nodeService.getOwnerBlses(accountAddress);
      expect(blsOwner).toBeInstanceOf(Array);
    });
  });

  describe('Get Node Version Raw', () => {
    it('should return node version', async () => {
      const nodeVersionRaw = await nodeService.getNodeVersionsRaw();
      expect(nodeVersionRaw).toBeInstanceOf(Object);
    });
  });

  describe('Get Node', () => {
    it('should return nodes based on bls', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.search = nodeSentinel.bls;
      const nodeBls = await nodeService.getNode(nodeFilter.search);
      expect(nodeBls).toBeInstanceOf(Object);
    });
  });
});

