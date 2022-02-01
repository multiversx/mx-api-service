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

describe('Node Service', () => {
  let nodeService: NodeService;
  let cachingService: CachingService;
  let providerService: ProviderService;
  let nodes: Node[];
  let providers: Provider[];
  let nodeSentinel: Node;

  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nodeService = publicAppModule.get<NodeService>(NodeService);
    cachingService = publicAppModule.get<CachingService>(CachingService);
    providerService = publicAppModule.get<ProviderService>(ProviderService);

    nodes = await nodeService.getAllNodes();
    providers = await providerService.getAllProviders();
    nodeSentinel = nodes[0];
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
          }
          else if (nodeKeybases[node.bls] && nodeKeybases[node.bls].confirmed) {
            expect(node.identity).toStrictEqual(nodeKeybases[node.bls].identity);
          }
          else {
            expect(node.identity).toBeUndefined();
          }
        }
      }
    });

    it('should be filtered by bls, name or version', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.search = nodeSentinel.bls;

      let filteredNodes = await nodeService.getNodes({ from: 0, size: 25 }, nodeFilter);
      for (const node of filteredNodes) {
        expect(node.bls).toStrictEqual(nodeSentinel.bls);
      }

      nodeFilter.search = nodeSentinel.version;
      filteredNodes = await nodeService.getNodes({ from: 0, size: 25 }, nodeFilter);
      for (const node of filteredNodes) {
        expect(node.version).toStrictEqual(nodeSentinel.version);
      }
    });

    it('should be filtered by provider and owner', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.provider = nodeSentinel.provider;
      nodeFilter.owner = nodeSentinel.owner;

      const filteredNodes = await nodeService.getNodes({ from: 0, size: 25 }, nodeFilter);
      for (const node of filteredNodes) {
        expect(node.provider).toStrictEqual(nodeSentinel.provider);
        expect(node.owner).toStrictEqual(nodeSentinel.owner);
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
        expect(node.online).toBeTruthy();
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
  });
});
