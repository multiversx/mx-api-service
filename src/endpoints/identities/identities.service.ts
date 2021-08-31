import { Injectable } from "@nestjs/common";
import { CachingService } from "src/common/caching.service";
import { KeybaseService } from "src/common/keybase.service";
import { Constants } from "src/utils/constants";
import { Node } from "../nodes/entities/node";
import { NodeService } from "../nodes/node.service";
import { NodesInfos } from "../providers/entities/nodes.infos";
import { Identity } from "./entities/identity";
import { StakeInfo } from "./entities/stake.info";

@Injectable()
export class IdentitiesService {
  constructor(
     private readonly nodeService: NodeService,
     private readonly keybaseService: KeybaseService,
     private readonly cachingService: CachingService
  ) {}

  async getIdentity(identifier: string): Promise<Identity | undefined> {
    let identities = await this.getAllIdentities();
    return identities.find(x => x.identity === identifier);
  }

  async getIdentities(ids: string[]): Promise<Identity[]> {
    let identities = await this.getAllIdentities();
    if (ids.length > 0) {
      identities = identities.filter(x => ids.includes(x.identity));
    }
    
    return identities;
  }

  async getAllIdentities(): Promise<Identity[]> {
    return this.cachingService.getOrSetCache('identities', async () => await this.getAllIdentitiesRaw(), Constants.oneMinute() * 15);
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
    let totalLocked = totalStake + totalTopUp;
    nodesInfo.locked = totalLocked.toString();

    return nodesInfo;
  }

  private getStakeDistributionForIdentity(locked: bigint, identity: any): {[key:string]: number} {
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

    const stakePercent = (locked * BigInt(10000)) / totalLocked;
    stakeInfo.stakePercent = parseFloat(stakePercent.toString()) / 100;

    const providers = identity.nodes
      .map((x: Node) => x.provider)
      .filter((provider: string | null) => !!provider);
    stakeInfo.providers = [...new Set(providers)];

    stakeInfo.distribution = this.getStakeDistributionForIdentity(locked, identity);

    stakeInfo.validators = identity.nodes.filter(
      (x: any) => x.type === 'validator' && x.status !== 'inactive'
    ).length;
    stakeInfo.sort = stakeInfo.locked && stakeInfo.locked !== '0' ? parseInt(stakeInfo.locked.slice(0, -18)) : 0;

    return stakeInfo;
  }

  async getAllIdentitiesRaw(): Promise<Identity[]> {
    let nodes = await this.nodeService.getAllNodes();

    let keys = [
      ...new Set(nodes.filter(({ identity }) => !!identity).map(({ identity }) => identity)),
    ].filter(x => x !== null).map(x => x ?? '');

    let identities: any[] = await this.cachingService.batchProcess(
      keys,
      key => `identityProfile:${key}`,
      async key => await this.keybaseService.getProfile(key),
      Constants.oneMinute() * 30
    );

    nodes.forEach((node) => {
      const found = identities.find(({ identity }) => identity === node.identity);

      if (found && node.identity && !!node.identity) {
        if (!found.nodes) {
          found.nodes = [];
        }

        found.nodes.push(node);
      } else {
        identities.push({ name: node.bls, nodes: [node] });
      }
    });

    const { locked: totalLocked } = this.computeTotalStakeAndTopUp(nodes);

    identities.forEach((identity: any) => {
      if (identity.nodes && identity.nodes.length) {
        const stakeInfo = this.getStakeInfoForIdentity(identity, BigInt(parseInt(totalLocked)));
        identity.score = stakeInfo.score;
        identity.validators = stakeInfo.validators
        identity.stake = stakeInfo.stake;
        identity.topUp = stakeInfo.topUp;
        identity.locked = stakeInfo.locked;
        identity.distribution = stakeInfo.distribution;
        identity.providers = stakeInfo.providers;
        identity.stakePercent = stakeInfo.stakePercent;
        identity.sort = stakeInfo.sort;
      }
    });

    identities = identities
    .filter(x => x !== false)
    .filter(({ locked }) => locked !== '0');

    identities.sort((a, b) => {
      return b.sort - a.sort;
    });

    identities.forEach((identity, index) => {
      delete identity.nodes;
      delete identity.sort;
      identity.rank = index + 1;
      console.log({ locked: identity.locked })
    });

    return identities;
  }
}