import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { GatewayService } from "src/helpers/gateway.service";
import { Node } from "src/endpoints/nodes/entities/node";
import { NodeType } from "./entities/node.type";
import { NodeStatus } from "./entities/node.status";
import { Queue } from "./entities/queue";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { ApiConfigService } from "src/helpers/api.config.service";
import { bech32Decode, bech32Encode, oneHour, oneMinute } from "src/helpers/helpers";
import { CachingService } from "src/helpers/caching.service";
import { KeybaseService } from "src/helpers/keybase.service";
import { NodeFilter } from "./entities/node.filter";
import { ProviderService } from "../providers/provider.service";
import { StakeService } from "../stake/stake.service";
import { SortOrder } from "src/helpers/entities/sort.order";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlockService } from "../blocks/block.service";
import { KeybaseState } from "src/helpers/entities/keybase.state";

@Injectable()
export class NodeService {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly keybaseService: KeybaseService,
    private readonly stakeService: StakeService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService,
    private readonly blockService: BlockService
  ) {}

  private getIssues(node: Node, version: string): string[] {
    const issues: string[] = [];
  
    // if (node.totalUpTimeSec === 0) {
    //   issues.push('offlineSinceGenesis'); // Offline since genesis
    // }
  
    if (version !== node.version) {
      issues.push('versionMismatch'); // Outdated client version
    }
  
    // if (node.receivedShardID !== node.computedShardID && node.peerType === 'eligible') {
    //   issues.push('shuffledOut'); // Shuffled out restart failed
    // }
  
    return issues;
  };

  async getNode(bls: string): Promise<Node | undefined> {
    let allNodes = await this.getAllNodes();
    return allNodes.find(x => x.bls === bls);
  }

  async getNodeCount(query: NodeFilter): Promise<number> {
    let allNodes = await this.getFilteredNodes(query);
    return allNodes.length;
  }

  async getNodeVersions(): Promise<NodeVersions> {
    let allNodes = await this.getAllNodes();

    const data = allNodes
        .filter(({ type }) => type === NodeType.validator)
        .reduce((accumulator: any, item) => {
          if (item.version) {
            if (!accumulator[item.version]) {
              accumulator[item.version] = 1;
            } else {
              accumulator[item.version] += 1;
            }
          }

          return accumulator;
        }, {});

      const sum = Object.keys(data).reduce((accumulator, item) => {
        return accumulator + data[item];
      }, 0);

      Object.keys(data).forEach((key) => {
        data[key] = parseFloat((data[key] / sum).toFixed(2));
      });

      return data;
  }

  private async getFilteredNodes(query: NodeFilter): Promise<Node[]> {
    let allNodes = await this.getAllNodes();

    let filteredNodes = allNodes.filter(node => {
      if (query.search !== undefined) {
        const nodeMatches = node.bls.toLowerCase().includes(query.search.toLowerCase());
        const nameMatches = node.name && node.name.toLowerCase().includes(query.search.toLowerCase());
        const versionMatches = node.version && node.version.toLowerCase().includes(query.search.toLowerCase());

        if (!nodeMatches && !nameMatches && !versionMatches) {
          return false;
        }
      }

      if (query.online !== undefined && node.online !== query.online) {
        return false;
      }

      if (query.type !== undefined && node.type !== query.type) {
        return false;
      }

      if (query.status !== undefined && node.status !== query.status) {
        return false;
      }

      if (query.shard !== undefined && node.shard !== query.shard) {
        return false;
      }

      if (query.issues !== undefined && (query.issues === true ? node.issues.length === 0 : node.issues.length > 0)) {
        return false;
      }

      if (query.identity && node.identity !== query.identity) {
        return false;
      }

      if (query.provider && node.provider !== query.provider) {
        return false;
      }

      if (query.owner && node.owner !== query.owner) {
        return false;
      }

      return true;
    });

    if (query.sort) {
      filteredNodes.sort((a: any, b: any) => {
        let asort = a[query.sort ?? ''];
        let bsort = b[query.sort ?? ''];

        if (asort && typeof asort === 'string') {
          asort = asort.toLowerCase();
        }

        if (bsort && typeof bsort === 'string') {
          bsort = bsort.toLowerCase();
        }

        return asort > bsort ? 1 : bsort > asort ? -1 : 0;
      });

      if (query.order === SortOrder.desc) {
        filteredNodes.reverse();
      }
    }

    return filteredNodes;
  }

  async getNodes(queryPagination: QueryPagination, query: NodeFilter): Promise<Node[]> {
    const { from, size } = queryPagination;

    let filteredNodes = await this.getFilteredNodes(query);

    return filteredNodes.slice(from, from + size);
  }

  async getAllNodes(): Promise<Node[]> {
    return await this.cachingService.getOrSetCache('nodes', async () => await this.getAllNodesRaw(), oneHour(), oneMinute());
  }

  async getAllNodesRaw(): Promise<Node[]> {
    let nodes = await this.getHeartbeat();
    let queue = await this.getQueue();

    for (let queueItem of queue) {
      const node = nodes.find(node => node.bls === queueItem.bls);
  
      if (node) {
        node.type = NodeType.validator;
        node.status = NodeStatus.queued;
        node.position = queueItem.position;
      } else {
        let newNode = new Node();
        newNode.bls = queueItem.bls;
        newNode.position = queueItem.position;
        newNode.type = NodeType.validator;
        newNode.status = NodeStatus.queued;

        nodes.push(newNode);
      }
    }

    const keybases: { [key: string]: KeybaseState } | undefined = await this.keybaseService.getCachedNodeKeybases();

    for (let node of nodes) {
      delete node.identity;

      if (keybases && keybases[node.bls] && keybases[node.bls].confirmed) {
        node.identity = keybases[node.bls].identity;
      }
    }

    const blses = nodes.filter(node => node.type === NodeType.validator).map(node => node.bls);
    const epoch = await this.blockService.getCurrentEpoch();
    const owners = await this.getOwners(blses, epoch);

    for (let [index, bls] of blses.entries()) {
      const node = nodes.find(node => node.bls === bls);
      if (node) {
        node.owner = owners[index];
      }
    }

    const providers = await this.providerService.getAllProviders();

    nodes.forEach((node) => {
      if (node.type === NodeType.validator) {
        const provider = providers.find(({ provider }) => provider === node.owner);

        if (provider) {
          node.provider = provider.provider;
          node.owner = provider.owner ?? '';
        }
      }
    });

    let addresses = nodes
      .filter(({ type }) => type === NodeType.validator)
      .map(({ owner, provider }) => (provider ? provider : owner));
  
    addresses = [...new Set(addresses)];

    const stakes = await this.stakeService.getStakes(addresses);

    nodes.forEach((node) => {
      if (node.type === 'validator') {
        const stake = stakes.find(({ bls }) => bls === node.bls);

        if (stake) {
          node.stake = stake.stake;
          node.topUp = stake.topUp;
          node.locked = stake.locked;
        }
      }
    });

    return nodes;
  }

  async getOwners(blses: string[], epoch: number) {
    const keys = blses.map((bls) => `owner:${epoch}:${bls}`);

    let cached = await this.cachingService.batchGetCache(keys);

    const missing = cached
      .map((element, index) => (element === null ? index : false))
      .filter((element) => element !== false)
      .map(element => element as number);

    let owners: any = {};

    if (missing.length) {
      for (const index of missing) {
        const bls = blses[index];

        if (!owners[bls]) {
          const owner = await this.getBlsOwner(bls);
          if (owner) {
            const blses = await this.getOwnerBlses(owner);

            blses.forEach(bls => {
              owners[bls] = owner;
            });
          }
        }
      }

      const params = {
        keys: Object.keys(owners).map((bls) => `owner:${epoch}:${bls}`),
        values: Object.values(owners),
        ttls: new Array(Object.keys(owners).length).fill(60 * 60 * 24), // 24h
      };

      await this.cachingService.batchSetCache(params.keys, params.values, params.ttls);
    }

    return blses.map((bls, index) => (missing.includes(index) ? owners[bls] : cached[index]));
  };
  
  async getBlsOwner(bls: string): Promise<string | undefined> {
    let result = await this.vmQueryService.vmQuery(
      this.apiConfigService.getStakingContractAddress(),
      'getOwner',
      this.apiConfigService.getAuctionContractAddress(),
      [ bls ],
    );

    if (!result) {
      return undefined;
    }

    const [encodedOwnerBase64] = result;
  
    return bech32Encode(Buffer.from(encodedOwnerBase64, 'base64').toString('hex'));
  };

  async getOwnerBlses(owner: string): Promise<string[]> {
    const getBlsKeysStatusListEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getAuctionContractAddress(),
      'getBlsKeysStatus',
      this.apiConfigService.getAuctionContractAddress(),
      [ bech32Decode(owner) ],
    );
  
    if (!getBlsKeysStatusListEncoded) {
      return [];
    }
  
    return getBlsKeysStatusListEncoded.reduce((result: any[], _: string, index: number, array: string[]) => {
      if (index % 2 === 0) {
        const [blsBase64, _] = array.slice(index, index + 2);
  
        const bls = Buffer.from(blsBase64, 'base64').toString('hex');
  
        result.push(bls);
      }
  
      return result;
    }, []);
  };

  async getQueue(): Promise<Queue[]> {
    const queueEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getStakingContractAddress(),
      'getQueueRegisterNonceAndRewardAddress',
      this.apiConfigService.getAuctionContractAddress(),
    );

    if (!queueEncoded) {
      return [];
    }

    return queueEncoded.reduce((result: Queue[], _: any, index: number, array: any) => {
      if (index % 3 === 0) {
        const [blsBase64, rewardsBase64, nonceBase64] = array.slice(index, index + 3);

        const bls = Buffer.from(blsBase64, 'base64').toString('hex');

        const rewardsHex = Buffer.from(rewardsBase64, 'base64').toString('hex');
        const rewards = bech32Encode(rewardsHex);

        const nonceHex = Buffer.from(nonceBase64, 'base64').toString('hex');
        const nonce = parseInt(BigInt(nonceHex ? '0x' + nonceHex : nonceHex).toString());

        result.push({ bls, nonce, rewards, position: index / 3 + 1 });
      }

      return result;
    }, []);
  }

  async getHeartbeat(): Promise<Node[]> {
    const [
      { heartbeats },
      { statistics },
      { config }
    ] = await Promise.all([
      this.gatewayService.get('node/heartbeatstatus'),
      this.gatewayService.get('validator/statistics'),
      this.gatewayService.get('network/config')
    ]);

    let nodes: Node[] = [];

    const blses = [
      ...new Set([...Object.keys(statistics), ...heartbeats.map((item: any) => item.publicKey)]),
    ];

    for (const bls of blses) {
      const heartbeat = heartbeats.find((beat: any) => beat.publicKey === bls) || {};
      const statistic = statistics[bls] || {};

      const item = { ...heartbeat, ...statistic };

      let {
        nodeDisplayName: name,
        versionNumber: version,
        identity,
        tempRating,
        rating,
        ratingModifier,
        numLeaderSuccess: leaderSuccess,
        numLeaderFailure: leaderFailure,
        numValidatorSuccess: validatorSuccess,
        numValidatorFailure: validatorFailure,
        numValidatorIgnoredSignatures: validatorIgnoredSignatures,
        totalUpTimeSec: uptimeSec,
        totalDownTimeSec: downtimeSec,
        shardId: shard,
        receivedShardID,
        computedShardID,
        peerType,
        isActive: online,
        validatorStatus,
        nonce,
        numInstances: instances,
      } = item;

      if (shard === undefined) {
        if (peerType === 'observer') {
          shard = receivedShardID;
        } else {
          shard = computedShardID;
        }
      }

      let nodeType: NodeType | undefined = undefined;
      let nodeStatus: NodeStatus | undefined = undefined;

      let status = validatorStatus ? validatorStatus : peerType;
      nodeStatus = status;

      if (status === 'observer') {
        nodeType = NodeType.observer;
        nodeStatus = undefined;
      } else {
        nodeType = NodeType.validator;
        if (status && status.includes('leaving')) {
          nodeStatus = NodeStatus.leaving;
        }
      }

      const node: Node = {
        bls,
        name,
        version: version ? version.split('-')[0].split('/')[0] : '',
        identity: identity && identity !== '' ? identity.toLowerCase() : identity,
        rating: parseFloat(parseFloat(rating).toFixed(2)),
        tempRating: parseFloat(parseFloat(tempRating).toFixed(2)),
        ratingModifier: ratingModifier ? ratingModifier : 0,
        uptimeSec,
        downtimeSec,
        shard,
        type: nodeType,
        status: nodeStatus,
        online,
        nonce,
        instances,
        uptime: 0,
        downtime: 0,
        owner: '',
        provider: '',
        stake: '',
        topUp: '',
        locked: '',
        leaderFailure,
        leaderSuccess,
        validatorFailure,
        validatorIgnoredSignatures,
        validatorSuccess,
        issues: [],
        position: 0
      };

      if (node.uptimeSec === 0 && item.downtimeSec === 0) {
        node.uptime = item.online ? 100 : 0;
        node.downtime = item.online ? 0 : 100;
      } else {
        const uptime = (node.uptimeSec * 100) / (node.uptimeSec + node.downtimeSec);
        node.uptime = parseFloat(uptime.toFixed(2));
        node.downtime = parseFloat((100 - uptime).toFixed(2));
      }

      if (['queued', 'jailed'].includes(peerType)) {
        node.shard = undefined;
      }

      node.issues = this.getIssues(node, config.erd_latest_tag_software_version);

      nodes.push(node);
    }

    return nodes;
  }
}