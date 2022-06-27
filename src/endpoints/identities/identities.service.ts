import { CachingService } from "@elrondnetwork/nestjs-microservice-common";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import BigNumber from "bignumber.js";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { KeybaseIdentity } from "src/common/keybase/entities/keybase.identity";
import { KeybaseService } from "src/common/keybase/keybase.service";
import { NetworkService } from "../network/network.service";
import { Node } from "../nodes/entities/node";
import { NodeService } from "../nodes/node.service";
import { NodesInfos } from "../providers/entities/nodes.infos";
import { Identity } from "./entities/identity";
import { IdentityDetailed } from "./entities/identity.detailed";
import { StakeInfo } from "./entities/stake.info";

@Injectable()
export class IdentitiesService {
  constructor(
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    @Inject(forwardRef(() => KeybaseService))
    private readonly keybaseService: KeybaseService,
    private readonly cachingService: CachingService,
    @Inject(forwardRef(() => NetworkService))
    private readonly networkService: NetworkService
  ) { }

  async getIdentity(identifier: string): Promise<Identity | undefined> {
    const identities = await this.getAllIdentities();
    return identities.find(x => x.identity === identifier);
  }

  async getIdentities(ids: string[]): Promise<Identity[]> {
    let identities = await this.getAllIdentities();
    if (ids.length > 0) {
      identities = identities.filter(x => x.identity && ids.includes(x.identity));
    }

    return identities;
  }

  async getAllIdentities(): Promise<Identity[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.Identities.key,
      async () => await this.getAllIdentitiesRaw(),
      CacheInfo.Identities.ttl
    );
  }

  private computeTotalStakeAndTopUp(nodes: Node[]): NodesInfos {
    let totalStake = BigInt(0);
    let totalTopUp = BigInt(0);

    nodes.forEach((node) => {
      if (node.type == 'validator') {
        if (node.stake) {
          totalStake += BigInt(node.stake);
        }

        if (node.topUp) {
          totalTopUp += BigInt(node.topUp);
        }
      }
    });

    const nodesInfo = new NodesInfos();
    nodesInfo.numNodes = nodes.length;
    nodesInfo.stake = totalStake.toString();
    nodesInfo.topUp = totalTopUp.toString();
    const totalLocked = totalStake + totalTopUp;
    nodesInfo.locked = totalLocked.toString();

    return nodesInfo;
  }

  private getStakeDistributionForIdentity(locked: bigint, identity: any): { [key: string]: number } {
    const distribution = identity.nodes.reduce((accumulator: any, current: any) => {
      const stake = current.stake ? BigInt(current.stake) : BigInt(0);
      const topUp = current.topUp ? BigInt(current.topUp) : BigInt(0);

      if (current.provider) {
        if (!accumulator[current.provider]) {
          accumulator[current.provider] = BigInt(0);
        }

        accumulator[current.provider] += stake + topUp;
      } else {
        if (!accumulator.direct) {
          accumulator.direct = BigInt(0);
        }

        accumulator.direct += stake + topUp;
      }

      return accumulator;
    }, {});

    Object.keys(distribution).forEach((key) => {
      if (locked) {
        distribution[key] = Number((BigInt(100) * distribution[key]) / locked) / 100;
      } else {
        distribution[key] = null;
      }
    });

    if (distribution && Object.keys(distribution).length > 1) {
      const first = Object.keys(distribution)[0];
      const rest = Object.keys(distribution)
        .slice(1)
        .reduce((accumulator, current) => (accumulator += distribution[current]), 0);
      distribution[first] = parseFloat((1 - rest).toFixed(2));
    }

    for (const key of Object.keys(distribution)) {
      if (distribution[key] === 0) {
        // @ts-ignore
        delete distribution[key];
      }
    }

    return distribution;
  }

  private getStakeInfoForIdentity(identity: any, totalLocked: bigint): StakeInfo {
    const stakeInfo = new StakeInfo();

    const score: number = identity.nodes
      .map((x: Node) => x.ratingModifier)
      .reduce((acumulator: number, current: number) => acumulator + current);
    stakeInfo.score = Math.floor(score * 100);

    const stake: bigint = identity.nodes
      .map((x: Node) => (x.stake ? x.stake : '0'))
      .reduce((acumulator: bigint, current: string) => acumulator + BigInt(current), BigInt(0));
    stakeInfo.stake = stake.toString();

    const topUp: bigint = identity.nodes
      .map((x: Node) => (x.topUp ? x.topUp : '0'))
      .reduce((acumulator: bigint, current: string) => acumulator + BigInt(current), BigInt(0));
    stakeInfo.topUp = topUp.toString();

    const locked = stake + topUp;
    stakeInfo.locked = locked.toString();

    const stakePercent = totalLocked > 0 ? (locked * BigInt(10000)) / totalLocked : 0;
    stakeInfo.stakePercent = parseFloat(stakePercent.toString()) / 100;

    const providers = identity.nodes
      .map((x: Node) => x.provider)
      .filter((provider: string | null) => !!provider);
    stakeInfo.providers = providers.distinct();

    stakeInfo.distribution = this.getStakeDistributionForIdentity(locked, identity);

    stakeInfo.validators = identity.nodes.filter(
      (x: any) => x.type === 'validator' && x.status !== 'inactive'
    ).length;
    stakeInfo.sort = stakeInfo.locked && stakeInfo.locked !== '0' ? parseInt(stakeInfo.locked.slice(0, -18)) : 0;

    return stakeInfo;
  }

  async getAllIdentitiesRaw(): Promise<Identity[]> {
    const nodes = await this.nodeService.getAllNodes();
    const { baseApr, topUpApr } = await this.networkService.getApr();

    const keybaseIdentities: (KeybaseIdentity | undefined)[] = await this.keybaseService.getCachedIdentityProfilesKeybases();

    const identitiesDetailed: IdentityDetailed[] = [];

    for (const keybaseIdentity of keybaseIdentities) {
      if (keybaseIdentity && keybaseIdentity.identity) {
        const identityDetailed = new IdentityDetailed();
        identityDetailed.avatar = keybaseIdentity.avatar;
        identityDetailed.description = keybaseIdentity.description;
        identityDetailed.identity = keybaseIdentity.identity;
        identityDetailed.location = keybaseIdentity.location;
        identityDetailed.name = keybaseIdentity.name;
        identityDetailed.twitter = keybaseIdentity.twitter;
        identityDetailed.website = keybaseIdentity.website;
        identitiesDetailed.push(identityDetailed);
      }
    }

    for (const node of nodes) {
      const found = identitiesDetailed.find((identityDetailed) => identityDetailed.identity == node.identity);

      if (found && node.identity && !!node.identity) {
        if (!found.nodes) {
          found.nodes = [];
        }
        found.nodes.push(node);

        if (!found.name) {
          found.name = node.bls;
        }
      }
      else {
        const identityDetailed = new IdentityDetailed();
        identityDetailed.name = node.bls;
        identityDetailed.nodes = [node];
        identitiesDetailed.push(identityDetailed);
      }
    }

    const { locked: totalLocked } = this.computeTotalStakeAndTopUp(nodes);

    let identities: Identity[] = identitiesDetailed.map((identityDetailed: IdentityDetailed) => {
      if (identityDetailed.nodes && identityDetailed.nodes.length) {
        const identity = new Identity();
        identity.identity = identityDetailed.identity;
        identity.avatar = identityDetailed.avatar;
        identity.description = identityDetailed.description;
        identity.name = identityDetailed.name;
        identity.website = identityDetailed.website;
        identity.twitter = identityDetailed.twitter;
        identity.location = identityDetailed.location;

        const stakeInfo = this.getStakeInfoForIdentity(identityDetailed, BigInt(parseInt(totalLocked)));
        identity.score = stakeInfo.score;
        identity.validators = stakeInfo.validators;
        identity.stake = stakeInfo.stake;
        identity.topUp = stakeInfo.topUp;
        identity.locked = stakeInfo.locked;
        identity.distribution = stakeInfo.distribution;
        identity.providers = stakeInfo.providers;
        identity.stakePercent = stakeInfo.stakePercent;
        if (identity.stake && identity.topUp) {
          const stakeReturn = new BigNumber(identity.stake.slice(0, -18)).multipliedBy(new BigNumber(baseApr));
          const topUpReturn = new BigNumber(identity.topUp.slice(0, -18)).multipliedBy(new BigNumber(topUpApr));
          const annualReturn = stakeReturn.plus(topUpReturn);
          const aprStr = new BigNumber(annualReturn).multipliedBy(100).div(identity.locked.slice(0, -18)).toString();
          identity.apr = Number(aprStr).toRounded(2);
        }
        return identity;
      }
      return new Identity();
    });

    identities = identities
      .filter((identity) => identity && (identity.validators ?? 0) > 0);

    identities = identities.sortedDescending(identity => new BigNumber(identity.locked).dividedBy(10 ** 18).toNumber());

    for (const [index, identity] of identities.entries()) {
      if (identity) {
        identity.rank = index + 1;

        if (identity.avatar) {
          identity.avatar = this.processIdentityAvatar(identity.avatar);
        }
      }
    }

    return identities;
  }

  private processIdentityAvatar(avatar: string): string {
    // return avatar.replace('https://s3.amazonaws.com/keybase_processed_uploads', `${this.apiConfigService.getExternalMediaUrl()}/providers/asset`);
    return avatar;
  }
}
