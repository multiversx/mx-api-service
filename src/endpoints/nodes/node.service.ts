import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Node } from "src/endpoints/nodes/entities/node";
import { NodeType } from "./entities/node.type";
import { NodeStatus } from "./entities/node.status";
import { Queue } from "./entities/queue";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NodeFilter } from "./entities/node.filter";
import { ProviderService } from "../providers/provider.service";
import { StakeService } from "../stake/stake.service";
import { SortOrder } from "src/common/entities/sort.order";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlockService } from "../blocks/block.service";
import { KeybaseService } from "src/common/keybase/keybase.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { KeybaseState } from "src/common/keybase/entities/keybase.state";
import { CacheInfo } from "src/utils/cache.info";
import { Stake } from "../stake/entities/stake";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { Auction } from "src/common/gateway/entities/auction";
import { AddressUtils, Constants, CachingService } from "@elrondnetwork/erdnest";
import { NodeSort } from "./entities/node.sort";

@Injectable()
export class NodeService {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    @Inject(forwardRef(() => KeybaseService))
    private readonly keybaseService: KeybaseService,
    @Inject(forwardRef(() => StakeService))
    private readonly stakeService: StakeService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService,
    @Inject(forwardRef(() => BlockService))
    private readonly blockService: BlockService,
  ) { }

  private getIssues(node: Node, version: string | undefined): string[] {
    const issues: string[] = [];

    if (version && version !== node.version) {
      issues.push('versionMismatch'); // Outdated client version
    }

    // if (node.receivedShardID !== node.computedShardID && node.peerType === 'eligible') {
    //   issues.push('shuffledOut'); // Shuffled out restart failed
    // }

    return issues;
  }

  async getNode(bls: string): Promise<Node | undefined> {
    const allNodes = await this.getAllNodes();
    return allNodes.find(x => x.bls === bls);
  }

  async getNodeCount(query: NodeFilter): Promise<number> {
    const allNodes = await this.getFilteredNodes(query);
    return allNodes.length;
  }

  async getNodeVersions(): Promise<NodeVersions> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.NodeVersions.key,
      async () => await this.getNodeVersionsRaw(),
      CacheInfo.NodeVersions.ttl
    );
  }

  async getNodeVersionsRaw(): Promise<NodeVersions> {
    const allNodes = await this.getAllNodes();

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

    const numbers: number[] = Object.values(data);
    const totalSum = numbers.reduce((previous: number, current: number) => previous + current, 0);
    const largestNumber = numbers.sort((a: number, b: number) => b - a)[0];

    for (const key of Object.keys(data)) {
      if (data[key] === largestNumber) {
        data[key] = parseFloat((largestNumber + 1 - totalSum).toFixed(2));
        break;
      }
    }

    return data;
  }

  private async getFilteredNodes(query: NodeFilter): Promise<Node[]> {
    const allNodes = await this.getAllNodes();

    const filteredNodes = allNodes.filter(node => {
      if (query.search !== undefined) {
        const nodeMatches = node.bls && node.bls.toLowerCase().includes(query.search.toLowerCase());
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

      if (query.issues !== undefined) {
        if (query.issues === true && (node.issues === undefined || node.issues.length === 0)) {
          return false;
        } else if (query.issues === false && node.issues !== undefined && node.issues.length > 0) {
          return false;
        }
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

      if (query.auctioned !== undefined && node.auctioned !== query.auctioned) {
        return false;
      }

      if (query.fullHistory !== undefined) {
        if (query.fullHistory === true && !node.fullHistory) {
          return false;
        }

        if (query.fullHistory === false && node.fullHistory === true) {
          return false;
        }
      }

      return true;
    });

    const sort = query.sort;
    if (sort) {
      filteredNodes.sort((a: any, b: any) => {
        let asort = a[query.sort ?? ''];
        let bsort = b[query.sort ?? ''];

        if (sort === NodeSort.locked) {
          asort = Number(asort);
          bsort = Number(bsort);
        }

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

    const filteredNodes = await this.getFilteredNodes(query);

    return filteredNodes.slice(from, from + size);
  }

  async getAllNodes(): Promise<Node[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.Nodes.key,
      async () => await this.getAllNodesRaw(),
      CacheInfo.Nodes.ttl
    );
  }

  private processQueuedNodes(nodes: Node[], queue: Queue[]) {
    for (const queueItem of queue) {
      const node = nodes.find(node => node.bls === queueItem.bls);

      if (node) {
        node.type = NodeType.validator;
        node.status = NodeStatus.queued;
        node.position = queueItem.position;
      } else {
        const newNode = new Node();
        newNode.bls = queueItem.bls;
        newNode.position = queueItem.position;
        newNode.type = NodeType.validator;
        newNode.status = NodeStatus.queued;

        nodes.push(newNode);
      }
    }
  }

  private async getNodesIdentities(nodes: Node[]) {
    const keybases: { [key: string]: KeybaseState } | undefined = await this.keybaseService.getCachedNodesAndProvidersKeybases();

    if (keybases) {
      for (const node of nodes) {
        node.identity = undefined;

        if (keybases[node.bls] && keybases[node.bls].confirmed) {
          node.identity = keybases[node.bls].identity;
        }
      }
    }
  }

  private async getNodesOwnerAndProvider(nodes: Node[]) {
    const blses = nodes.filter(node => node.type === NodeType.validator).map(node => node.bls);
    const epoch = await this.blockService.getCurrentEpoch();
    const owners = await this.getOwners(blses, epoch);

    for (const [index, bls] of blses.entries()) {
      const node = nodes.find(node => node.bls === bls);
      if (node) {
        node.owner = owners[index];
      }
    }

    const providers = await this.providerService.getAllProviders();

    for (const node of nodes) {
      if (node.type === NodeType.validator) {
        const provider = providers.find(({ provider }) => provider === node.owner);

        if (provider) {
          node.provider = provider.provider;
          node.owner = provider.owner ?? '';

          if (provider.identity) {
            node.identity = provider.identity;
          }
        }
      }
    }
  }

  private async getNodesStakeDetails(nodes: Node[]) {
    let addresses = nodes
      .filter(({ type }) => type === NodeType.validator)
      .map(({ owner, provider }) => (provider ? provider : owner));

    addresses = addresses.distinct();

    const stakes = await this.stakeService.getStakes(addresses);

    for (const node of nodes) {
      if (node.type === 'validator') {
        let stake = stakes.find(({ bls }) => bls === node.bls) ?? new Stake();

        if (node.status === "jailed") {
          stake = stakes.find(({ address }) => node.provider ? address === node.provider : address === node.owner) ?? new Stake();
        }

        node.stake = stake.stake;
        node.topUp = stake.topUp;
        node.locked = stake.locked;
      }
    }
  }

  async getAllNodesRaw(): Promise<Node[]> {
    const nodes = await this.getHeartbeat();
    const queue = await this.getQueue();

    this.processQueuedNodes(nodes, queue);

    await this.getNodesIdentities(nodes);

    await this.getNodesOwnerAndProvider(nodes);

    await this.getNodesStakeDetails(nodes);

    if (this.apiConfigService.isStakingV4Enabled()) {
      const auctions = await this.gatewayService.getAuctions();
      this.processAuctions(nodes, auctions);
    }

    return nodes;
  }

  processAuctions(nodes: Node[], auctions: Auction[]) {
    for (const node of nodes) {
      let position = 1;
      for (const auction of auctions) {
        for (const auctionNode of auction.auctionList) {
          if (node.bls === auctionNode.blsKey) {
            node.auctioned = true;
            node.auctionPosition = position;
            node.auctionTopUp = auction.qualifiedTopUp;
            node.auctionSelected = auctionNode.selected;
          }

          position++;
        }
      }
    }
  }

  async getOwners(blses: string[], epoch: number) {
    const keys = blses.map((bls) => CacheInfo.OwnerByEpochAndBls(bls, epoch).key);

    const cached = await this.cachingService.batchGetCacheRemote(keys);

    const missing = cached
      .map((element, index) => (element === null ? index : false))
      .filter((element) => element !== false)
      .map(element => element as number);

    const owners: any = {};

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

      const fastWarm = this.apiConfigService.getIsFastWarmerCronActive();
      const params = {
        keys: Object.keys(owners).map((bls) => CacheInfo.OwnerByEpochAndBls(bls, epoch).key),
        values: Object.values(owners),
        ttls: new Array(Object.keys(owners).length).fill(fastWarm ? 60 : Constants.oneDay()), // 1 minute or 24h
      };

      await this.cachingService.batchSetCache(params.keys, params.values, params.ttls);
    }

    return blses.map((bls, index) => (missing.includes(index) ? owners[bls] : cached[index]));
  }

  async getBlsOwner(bls: string): Promise<string | undefined> {
    const result = await this.vmQueryService.vmQuery(
      this.apiConfigService.getStakingContractAddress(),
      'getOwner',
      this.apiConfigService.getAuctionContractAddress(),
      [bls],
    );

    if (!result) {
      return undefined;
    }

    const [encodedOwnerBase64] = result;

    return AddressUtils.bech32Encode(Buffer.from(encodedOwnerBase64, 'base64').toString('hex'));
  }

  async getOwnerBlses(owner: string): Promise<string[]> {
    const getBlsKeysStatusListEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getAuctionContractAddress(),
      'getBlsKeysStatus',
      this.apiConfigService.getAuctionContractAddress(),
      [AddressUtils.bech32Decode(owner)],
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
  }

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
        const [blsBase64, rewardsAddressBase64, nonceBase64] = array.slice(index, index + 3);

        const bls = Buffer.from(blsBase64, 'base64').toString('hex');

        const rewardsAddressHex = Buffer.from(rewardsAddressBase64, 'base64').toString('hex');
        const rewardsAddress = AddressUtils.bech32Encode(rewardsAddressHex);

        const nonceHex = Buffer.from(nonceBase64, 'base64').toString('hex');
        const nonce = parseInt(BigInt(nonceHex ? '0x' + nonceHex : nonceHex).toString());

        result.push({ bls, nonce, rewardsAddress, position: index / 3 + 1 });
      }

      return result;
    }, []);
  }

  async getHeartbeat(): Promise<Node[]> {
    const [
      heartbeats,
      { statistics },
      config,
    ] = await Promise.all([
      this.gatewayService.getHeartbeatsStatus(),
      this.gatewayService.get('validator/statistics', GatewayComponentRequest.validatorStatistics),
      this.gatewayService.getNetworkConfig(),
    ]);

    const nodes: Node[] = [];

    const blses =
      [...Object.keys(statistics), ...heartbeats.map((item: any) => item.publicKey)].distinct();


    for (const bls of blses) {
      const heartbeat = heartbeats.find((beat: any) => beat.publicKey === bls) || {};
      const statistic = statistics[bls] || {};

      const item = { ...heartbeat, ...statistic };

      const {
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
        receivedShardID,
        computedShardID,
        peerType,
        isActive: online,
        validatorStatus,
        nonce,
        numInstances: instances,
      } = item;

      let {
        shardId: shard,
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

      if (validatorStatus === 'new') {
        nodeType = NodeType.validator;
        nodeStatus = NodeStatus.new;
      } else if (validatorStatus === 'jailed') {
        nodeType = NodeType.validator;
        nodeStatus = NodeStatus.jailed;
      } else if (validatorStatus && validatorStatus.includes('leaving')) {
        nodeType = NodeType.validator;
        nodeStatus = NodeStatus.leaving;
      } else if (peerType === 'observer') {
        nodeType = NodeType.observer;
        nodeStatus = undefined;
      } else {
        nodeType = NodeType.validator;
        nodeStatus = peerType ? peerType : validatorStatus;
      }

      const node: Node = new Node({
        bls,
        name,
        version: version ? (version.includes('-rc') ? version.split('-').slice(0, 2).join('-').split('/')[0] : version.split('-')[0].split('/')[0]) : '',
        identity: identity && identity !== '' ? identity.toLowerCase() : identity,
        rating: parseFloat(parseFloat(rating).toFixed(2)),
        tempRating: parseFloat(parseFloat(tempRating).toFixed(2)),
        ratingModifier: ratingModifier ? ratingModifier : 0,
        fullHistory: item.peerSubType === 1 ? true : undefined,
        shard,
        type: nodeType,
        status: nodeStatus,
        online,
        nonce,
        instances,
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
        position: 0,
        auctioned: undefined,
        auctionPosition: undefined,
        auctionTopUp: undefined,
        auctionSelected: undefined,
      });

      if (['queued', 'jailed'].includes(peerType)) {
        node.shard = undefined;
      }

      if (node.online === undefined) {
        node.online = false;
      }

      node.issues = this.getIssues(node, config.erd_latest_tag_software_version);

      nodes.push(node);
    }

    return nodes;
  }

  async deleteOwnersForAddressInCache(address: string): Promise<string[]> {
    const nodes = await this.getAllNodes();
    const epoch = await this.blockService.getCurrentEpoch();
    const keys = nodes
      .filter(x => x.owner === address)
      .map(x => `owner:${epoch}:${x.bls}`);

    for (const key of keys) {
      await this.cachingService.deleteInCache(key);
    }

    return keys;
  }
}
