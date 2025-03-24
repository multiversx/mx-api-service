import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Node } from "src/endpoints/nodes/entities/node";
import { NodeType } from "./entities/node.type";
import { NodeStatus } from "./entities/node.status";
import { Queue } from "./entities/queue";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NodeFilter } from "./entities/node.filter";
import { StakeService } from "../stake/stake.service";
import { SortOrder } from "src/common/entities/sort.order";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlockService } from "../blocks/block.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { CacheInfo } from "src/utils/cache.info";
import { Stake } from "../stake/entities/stake";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { Auction } from "src/common/gateway/entities/auction";
import { AddressUtils, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { NodeSort } from "./entities/node.sort";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { KeysService } from "../keys/keys.service";
import { IdentitiesService } from "../identities/identities.service";
import { NodeAuction } from "./entities/node.auction";
import { NodeAuctionFilter } from "./entities/node.auction.filter";
import { Identity } from "../identities/entities/identity";
import { NodeSortAuction } from "./entities/node.sort.auction";
import { ApiService } from "@multiversx/sdk-nestjs-http";

@Injectable()
export class NodeService {
  private readonly logger = new OriginLogger(NodeService.name);

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cacheService: CacheService,
    @Inject(forwardRef(() => StakeService))
    private readonly stakeService: StakeService,
    @Inject(forwardRef(() => BlockService))
    private readonly blockService: BlockService,
    private readonly protocolService: ProtocolService,
    private readonly keysService: KeysService,
    @Inject(forwardRef(() => IdentitiesService))
    private readonly identitiesService: IdentitiesService,
    private readonly apiService: ApiService,
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
    const node = allNodes.find(x => x.bls === bls);

    if (this.apiConfigService.isNodeEpochsLeftEnabled()) {
      if (node && node.status === NodeStatus.waiting) {
        node.epochsLeft = await this.gatewayService.getNodeWaitingEpochsLeft(bls);
      }
    }
    return node;
  }

  async getNodeCount(query: NodeFilter): Promise<number> {
    const allNodes = await this.getFilteredNodes(query);
    return allNodes.length;
  }

  async getNodeVersions(): Promise<NodeVersions> {
    return await this.cacheService.getOrSet(
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
      data[key] = parseFloat((data[key] / sum).toFixed(4));
    });

    const numbers: number[] = Object.values(data);
    const totalSum = numbers.reduce((previous: number, current: number) => previous + current, 0);
    const largestNumber = numbers.sort((a: number, b: number) => b - a)[0];

    for (const key of Object.keys(data)) {
      if (data[key] === largestNumber) {
        data[key] = parseFloat((largestNumber + 1 - totalSum).toFixed(4));
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

      if (query.isAuctionDangerZone !== undefined) {
        if (query.isAuctionDangerZone === true && !node.isInDangerZone) {
          return false;
        }
      }

      if (query.keys !== undefined && !query.keys.includes(node.bls)) {
        return false;
      }

      if (query.isQualified !== undefined && node.auctionQualified !== query.isQualified) {
        return false;
      }

      if (query.isAuctioned !== undefined && node.auctioned !== query.isAuctioned) {
        return false;
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

    const resultNodes = filteredNodes.slice(from, from + size);

    if (query.withIdentityInfo) {
      const allIdentities = await this.identitiesService.getAllIdentities();
      const allIdentitiesDict = allIdentities.toRecord<Identity>(x => x.identity ?? '');

      for (const [index, node] of resultNodes.entries()) {
        if (node.identity) {
          const identity = allIdentitiesDict[node.identity];
          if (identity) {
            resultNodes[index] = new Node({
              ...node,
              identityInfo: identity,
            });
          }
        }
      }
    }

    return resultNodes;
  }

  async getAllNodes(): Promise<Node[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.Nodes.key,
      async () => await this.getAllNodesRaw(),
      CacheInfo.Nodes.ttl
    );
  }

  // @ts-ignore
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

  private async applyNodeIdentities(nodes: Node[]) {
    for (const node of nodes) {
      if (node.status !== NodeStatus.inactive) {
        node.identity = await this.cacheService.getRemote<string>(CacheInfo.ConfirmedIdentity(node.bls).key);
      }
    }
  }

  private async applyNodeOwners(nodes: Node[]) {
    const blses = nodes.filter(x => x.type === NodeType.validator).map(node => node.bls);
    const epoch = await this.blockService.getCurrentEpoch();
    const owners = await this.getOwners(blses, epoch);

    for (const [index, bls] of blses.entries()) {
      const node = nodes.find(node => node.bls === bls);
      if (node) {
        node.owner = owners[index];
      }
    }
  }

  private async applyNodeProviders(nodes: Node[]) {
    for (const node of nodes) {
      if (node.type === NodeType.validator) {
        const providerOwner = await this.cacheService.getRemote<string>(CacheInfo.ProviderOwner(node.owner).key);
        if (providerOwner) {
          node.provider = node.owner;
          node.owner = providerOwner;
        }
      }
    }
  }

  private async applyNodeUnbondingPeriods(nodes: Node[]): Promise<void> {
    const leavingNodes = nodes.filter(node => node.status === NodeStatus.leaving || node.status === NodeStatus.inactive);

    await Promise.all(leavingNodes.map(async node => {
      const keyUnbondPeriod = await this.keysService.getKeyUnbondPeriod(node.bls);
      node.remainingUnBondPeriod = keyUnbondPeriod?.remainingUnBondPeriod;
    }));
  }

  private async applyNodeStakeInfo(nodes: Node[]) {
    let addresses = nodes
      .filter(({ type }) => type === NodeType.validator)
      .map(({ owner, provider }) => (provider ? provider : owner))
      .filter(x => x);

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

  async getHeartbeatValidatorsAndQueue(): Promise<Node[]> {
    const nodes = await this.getHeartbeatAndValidators();

    const queue = await this.getQueue();

    this.processQueuedNodes(nodes, queue);

    return nodes;
  }

  async getAllNodesRaw(): Promise<Node[]> {
    if (this.apiConfigService.isNodesFetchFeatureEnabled()) {
      return await this.getAllNodesFromApi();
    }

    const nodes = await this.getHeartbeatValidatorsAndQueue();

    await this.applyNodeIdentities(nodes);

    await this.applyNodeOwners(nodes);

    await this.applyNodeProviders(nodes);

    await this.applyNodeStakeInfo(nodes);

    const currentEpoch = await this.blockService.getCurrentEpoch();
    if (this.apiConfigService.isStakingV4Enabled() && currentEpoch >= this.apiConfigService.getStakingV4ActivationEpoch()) {
      const auctions = await this.gatewayService.getValidatorAuctions();
      this.processAuctions(nodes, auctions);
    }

    await this.applyNodeUnbondingPeriods(nodes);

    return nodes;
  }

  private async getAllNodesFromApi(): Promise<Node[]> {
    try {
      const { data } = await this.apiService.get(`${this.apiConfigService.getNodesFetchServiceUrl()}/nodes`, { params: { size: 10000 } });

      return data;
    } catch (error) {
      this.logger.error('An unhandled error occurred when getting nodes from API');
      this.logger.error(error);

      throw error;
    }
  }

  processAuctions(nodes: Node[], auctions: Auction[]) {
    const minimumAuctionStake = this.stakeService.getMinimumAuctionStake(auctions);
    const dangerZoneThreshold = BigInt(minimumAuctionStake) * BigInt(105) / BigInt(100);
    for (const node of nodes) {
      let position = 1;
      for (const auction of auctions) {
        if (auction.nodes) {
          for (const auctionNode of auction.nodes) {
            if (node.bls === auctionNode.blsKey) {
              node.auctioned = true;
              node.auctionPosition = position;
              node.auctionTopUp = auction.qualifiedTopUp;
              node.auctionQualified = auctionNode.qualified;

              const stakeBigInt = BigInt(node.stake);
              const auctionTopUpBigInt = BigInt(node.auctionTopUp);
              const qualifiedStakeBigInt = stakeBigInt + auctionTopUpBigInt;

              node.qualifiedStake = qualifiedStakeBigInt.toString();
            }

            const nodeStake = node.stake || "0";
            const nodeAuctionTopUp = node.auctionTopUp || "0";

            const totalStake = BigInt(nodeStake) + BigInt(nodeAuctionTopUp);
            if (node.status === NodeStatus.auction && node.auctionQualified && totalStake < dangerZoneThreshold) {
              node.isInDangerZone = true;
            }

            position++;
          }
        }
      }
    }
  }

  async getOwners(blses: string[], epoch: number) {
    const keys = blses.map((bls) => CacheInfo.OwnerByEpochAndBls(epoch, bls).key);

    const cached = await this.cacheService.batchGetManyRemote(keys);

    const owners: any = {};
    const missing = cached
      .map((element, index) => (element === null ? index : false))
      .filter((element) => element !== false)
      .map(element => element as number);

    if (missing.length) {
      for (const index of missing) {
        const bls = blses[index];

        if (!owners[bls]) {
          const owner = await this.getBlsOwner(bls);
          if (owner) {
            const blses = await this.getOwnerBlses(owner);

            for (const bls of blses) {
              owners[bls] = owner;
              await this.cacheService.setRemote(
                CacheInfo.OwnerByEpochAndBls(epoch, bls).key,
                owner,
                CacheInfo.OwnerByEpochAndBls(epoch, bls).ttl
              );
            }
          }
        }
      }
    }

    return blses.map((bls, index) => (missing.includes(index) ? owners[bls] : cached[index]));
  }

  async getBlsOwner(bls: string): Promise<string | undefined> {
    const auctionContractAddress = this.apiConfigService.getAuctionContractAddress();
    if (!auctionContractAddress) {
      return undefined;
    }

    const stakingContractAddress = this.apiConfigService.getStakingContractAddress();
    if (!stakingContractAddress) {
      return undefined;
    }

    const result = await this.vmQueryService.vmQuery(
      stakingContractAddress,
      'getOwner',
      auctionContractAddress,
      [bls],
    );

    if (!result) {
      return undefined;
    }

    const [encodedOwnerBase64] = result;

    return AddressUtils.bech32Encode(Buffer.from(encodedOwnerBase64, 'base64').toString('hex'));
  }

  async getOwnerBlses(owner: string): Promise<string[]> {
    const auctionContractAddress = this.apiConfigService.getAuctionContractAddress();
    if (!auctionContractAddress) {
      return [];
    }

    let getBlsKeysStatusListEncoded: string[] | undefined = undefined;

    try {
      getBlsKeysStatusListEncoded = await this.vmQueryService.vmQuery(
        auctionContractAddress,
        'getBlsKeysStatus',
        auctionContractAddress,
        [AddressUtils.bech32Decode(owner)],
      );
    } catch (error) {
      this.logger.error(`An unhandled error occurred when getting BLSes for owner '${owner}'`);
      this.logger.error(error);
      return [];
    }

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
    const auctionContractAddress = this.apiConfigService.getAuctionContractAddress();
    if (!auctionContractAddress) {
      return [];
    }

    const stakingContractAddress = this.apiConfigService.getStakingContractAddress();
    if (!stakingContractAddress) {
      return [];
    }

    const queueEncoded = await this.vmQueryService.vmQuery(
      stakingContractAddress,
      'getQueueRegisterNonceAndRewardAddress',
      auctionContractAddress,
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

  async getHeartbeatAndValidators(): Promise<Node[]> {
    const [
      heartbeats,
      { statistics },
      config,
    ] = await Promise.all([
      this.gatewayService.getNodeHeartbeatStatus(),
      this.gatewayService.get('validator/statistics', GatewayComponentRequest.validatorStatistics),
      this.gatewayService.getNetworkConfig(),
    ]);

    const nodes: Node[] = [];

    const blses = [...Object.keys(statistics), ...heartbeats.map((item: any) => item.publicKey)].distinct();

    const nodesPerShardDict: Record<string, number> = {};
    if (this.apiConfigService.isNodeSyncProgressEnabled()) {
      const shardIds = await this.protocolService.getShardIds();

      for (const shardId of shardIds) {
        const shardTrieStatistics = await this.gatewayService.getTrieStatistics(shardId);

        nodesPerShardDict[shardId] = shardTrieStatistics.accounts_snapshot_num_nodes;
      }
    }

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
        numTrieNodesReceived,
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
      }
      else if (validatorStatus === 'auction') {
        nodeType = NodeType.validator;
        nodeStatus = NodeStatus.auction;
      }
      else if (validatorStatus === 'jailed') {
        nodeType = NodeType.validator;
        nodeStatus = NodeStatus.jailed;
      } else if (validatorStatus && validatorStatus.includes('leaving')) {
        nodeType = NodeType.validator;
        nodeStatus = NodeStatus.leaving;
      } else if (validatorStatus === 'inactive') {
        nodeType = NodeType.validator;
        nodeStatus = NodeStatus.inactive;
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
        version: version ? (version.includes('-rc') || version.includes('-patch') ? version.split('-').slice(0, 2).join('-').split('/')[0] : version.split('-')[0].split('/')[0]) : '',
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
        auctionQualified: undefined,
      });

      if (['queued', 'jailed'].includes(peerType)) {
        node.shard = undefined;
      }

      if (node.online === undefined) {
        node.online = false;
      }

      const nodesPerShard = nodesPerShardDict[shard];
      if (this.apiConfigService.isNodeSyncProgressEnabled() && numTrieNodesReceived > 0 && nodesPerShard > 0) {
        node.syncProgress = numTrieNodesReceived / nodesPerShard;

        if (node.syncProgress > 1) {
          node.syncProgress = 1;
        }
      }

      node.issues = this.getIssues(node, config.erd_latest_tag_software_version);

      nodes.push(node);
    }

    return nodes;
  }

  async getAllNodesAuctions(): Promise<NodeAuction[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.NodesAuctions.key,
      async () => await this.getAllNodesAuctionsRaw(),
      CacheInfo.NodesAuctions.ttl
    );
  }

  async getAllNodesAuctionsRaw(): Promise<NodeAuction[]> {
    const allNodes = await this.getNodes(new QueryPagination({ size: 10000 }), new NodeFilter({ status: NodeStatus.auction }));

    const groupedNodes = allNodes.groupBy(node => (node.provider || node.owner) + ':' + (BigInt(node.stake).toString()) + (BigInt(node.topUp).toString()), true);

    const nodesWithAuctionData: NodeAuction[] = [];

    for (const group of groupedNodes) {
      const node: Node = group.values[0];

      const identity = node.identity ? await this.identitiesService.getIdentity(node.identity) : undefined;

      const nodeAuction = new NodeAuction({
        identity: identity?.identity,
        name: identity?.name,
        description: identity?.description,
        avatar: identity?.avatar,
        distribution: identity?.distribution,
        stake: node.stake || '0',
        owner: node.owner,
        provider: node.provider,
        auctionTopUp: node.auctionTopUp || '0',
        qualifiedStake: node.qualifiedStake || '0',
        auctionValidators: group.values.filter((node: Node) => node.auctioned).length,
        qualifiedAuctionValidators: group.values.filter((node: Node) => node.auctionQualified === true).length,
        droppedValidators: group.values.filter((node: Node) => node.auctionQualified === false).length,
        dangerZoneValidators: group.values.filter((node: Node) => node.isInDangerZone).length,
      });

      if (group.values.length === 1 && !node.provider && !node.identity) {
        nodeAuction.bls = node.bls;
      }

      nodesWithAuctionData.push(nodeAuction);
    }

    return nodesWithAuctionData;
  }

  async getNodesAuctions(pagination: QueryPagination, filter: NodeAuctionFilter): Promise<NodeAuction[]> {
    let nodesWithAuctionData = await this.getAllNodesAuctions();

    const sort = filter?.sort ?? NodeSortAuction.qualifiedStake;
    const order = !filter?.sort && !filter?.order ? SortOrder.desc : filter?.order;
    nodesWithAuctionData = nodesWithAuctionData.sorted(node => Number(node[sort]), node => node.qualifiedAuctionValidators === 0 ? 0 : 1, node => 0 - node.droppedValidators);

    if (order === SortOrder.desc) {
      nodesWithAuctionData.reverse();
    }

    return nodesWithAuctionData.slice(pagination.from, pagination.size);
  }

  async deleteOwnersForAddressInCache(address: string): Promise<string[]> {
    const nodes = await this.getAllNodes();
    const epoch = await this.blockService.getCurrentEpoch();
    const keys = nodes
      .filter(x => x.owner === address)
      .map(x => CacheInfo.OwnerByEpochAndBls(epoch, x.bls).key);

    for (const key of keys) {
      await this.cacheService.deleteInCache(key);
    }

    return keys;
  }
}
