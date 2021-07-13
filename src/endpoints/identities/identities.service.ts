import { Injectable } from "@nestjs/common";
import { CachingService } from "src/helpers/caching.service";
import { oneMinute } from "src/helpers/helpers";
import { KeybaseService } from "src/helpers/keybase.service";
import { NodeService } from "../nodes/node.service";
import { Identity } from "./entities/identity";

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
    return this.cachingService.getOrSetCache('identities', async () => await this.getAllIdentitiesRaw(), oneMinute() * 15);
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
      oneMinute() * 30
    );

    let totalStake = BigInt(0);
    let totalTopUp = BigInt(0);

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

      if (node.type == 'validator') {
        if (node.stake) {
          totalStake += BigInt(node.stake);
        }

        if (node.topUp) {
          totalTopUp += BigInt(node.topUp);
        }
      }
    });

    const totalLocked = totalStake + totalTopUp;

    identities.forEach((identity: any) => {
      if (identity.nodes && identity.nodes.length) {
        const score = identity.nodes
          .map((x: any) => x.ratingModifier)
          .reduce((acumulator: number, current: number) => acumulator + current);

        const stake = identity.nodes
          .map((x: any) => (x.stake ? x.stake : '0'))
          .reduce((acumulator: bigint, current: string) => acumulator + BigInt(current), BigInt(0));

        const topUp = identity.nodes
          .map((x: any) => (x.topUp ? x.topUp : '0'))
          .reduce((acumulator: bigint, current: string) => acumulator + BigInt(current), BigInt(0));

        const locked = stake + topUp;

        const stakePercent = (locked * BigInt(10000)) / totalLocked;

        const providers = identity.nodes
          .map((x: any) => x.provider)
          .filter((provider: string | null) => !!provider);

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

        identity.score = Math.floor(score * 100);
        identity.validators = identity.nodes.filter(
          (x: any) => x.type === 'validator' && x.status !== 'inactive'
        ).length;
        identity.stake = stake.toString();
        identity.topUp = topUp.toString();
        identity.locked = locked.toString();
        identity.distribution = distribution;
        identity.providers = [...new Set(providers)];
        identity.stakePercent = parseFloat((Number(stakePercent) / 100).toFixed(2));
        identity.sort =
          identity.locked && identity.locked !== '0' ? parseInt(identity.locked.slice(0, -18)) : 0;
      }
    });

    identities.sort((a, b) => {
      return b.sort - a.sort;
    });

    identities.forEach((identity) => {
      delete identity.nodes;
      delete identity.sort;
    });

    identities = identities
      .filter(x => x !== false)
      .filter(({ locked }) => locked !== '0');

    identities.forEach((identity, index) => {
      identity.rank = index + 1;
    });

    // @ts-ignore
    return identities;
  }
}