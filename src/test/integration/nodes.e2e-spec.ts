import { Test } from "@nestjs/testing";
import { CachingService } from "src/common/caching.service";
import { KeybaseState } from "src/common/entities/keybase.state";
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
  }, Constants.oneHour() * 1000);

  beforeEach(async () => {
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nodeService = publicAppModule.get<NodeService>(NodeService);
    cachingService = publicAppModule.get<CachingService>(CachingService);
    providerService = publicAppModule.get<ProviderService>(ProviderService);
    nodes = await nodeService.getAllNodes();
    providers = await providerService.getAllProviders();
    nodeSentinel = nodes[0];
  });

  describe('Nodes', () => {
    it('all nodes should have bls and type', async () => {
      for (let node of nodes) {
        expect(node).toHaveProperty('bls');
        expect(node).toHaveProperty('type');
      }
    });

    it('should be in sync with keybase confirmations', async () => {
      const nodeKeybases:{ [key: string]: KeybaseState } | undefined = await cachingService.getCache('nodeKeybases');
      expect(nodeKeybases).toBeDefined();

      if(nodeKeybases) {
        for (let node of nodes) {
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

      let filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
      for (let node of filteredNodes) {
        expect(node.bls).toStrictEqual(nodeSentinel.bls);
      }

      nodeFilter.search = nodeSentinel.version;
      filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
      for (let node of filteredNodes) {
        expect(node.version).toStrictEqual(nodeSentinel.version);
      }
    });

    it('should be filtered by provider and owner', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.provider = nodeSentinel.provider;
      nodeFilter.owner = nodeSentinel.owner;

      let filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
      for (let node of filteredNodes) {
        expect(node.provider).toStrictEqual(nodeSentinel.provider);
        expect(node.owner).toStrictEqual(nodeSentinel.owner);
      }
    });

    it('should have validator type', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.type = NodeType.validator;

      let filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
      for (let node of filteredNodes) {
        expect(node.type).toStrictEqual(NodeType.validator);
      }
    });

    it('all nodes should be online with eligible status', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.status = NodeStatus.eligible;
      nodeFilter.online = true;

      let filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
      for (let node of filteredNodes) {
        expect(node.status).toStrictEqual(NodeStatus.eligible);
        expect(node.online).toBeTruthy();
      }
    });

    it('should be sorted in ascending order by uptime', async () => {
      const nodeFilter: NodeFilter = new NodeFilter();
      nodeFilter.sort = NodeSort.uptime;

      let filteredNodes = await nodeService.getNodes({from: 0, size: 25}, nodeFilter);
      let currentUptime = 0;
      for (let node of filteredNodes) {
        if(node.uptime) {
          expect(node.uptime).toBeGreaterThanOrEqual(currentUptime);
          currentUptime = node.uptime;
        }
      }
    });
  });
});