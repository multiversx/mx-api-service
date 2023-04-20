import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { KeybaseIdentity } from "./entities/keybase.identity";
import { CacheInfo } from "../../utils/cache.info";
import { ElrondCachingService, Constants, OriginLogger, AddressUtils } from "@multiversx/sdk-nestjs";
import fs from 'fs';
import path from 'path';
@Injectable()
export class KeybaseService {
  private readonly logger = new OriginLogger(KeybaseService.name);

  constructor(
    private readonly cachingService: ElrondCachingService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService,
  ) { }

  private async getProviderIdentities(): Promise<string[]> {
    const providers = await this.providerService.getProviderAddresses();
    const metadatas = await
      this.cachingService.batchProcess(
        providers,
        address => `providerMetadata:${address}`,
        async address => await this.providerService.getProviderMetadata(address),
        Constants.oneMinute() * 15,
      );

    return metadatas.filter(x => x.identity).map(x => x.identity ?? '');
  }

  private async getHeartbeatAndValidatorIdentities(): Promise<string[]> {
    const nodes = await this.nodeService.getHeartbeatAndValidators();

    return nodes.filter(x => x.identity).map(x => x.identity ?? '');
  }

  private async getDistinctIdentities(): Promise<string[]> {
    const providerIdentities = await this.getProviderIdentities();
    const heartbeatAndValidatorIdentities = await this.getHeartbeatAndValidatorIdentities();
    const allIdentities = [...providerIdentities, ...heartbeatAndValidatorIdentities];

    const distinctIdentities = allIdentities.distinct().shuffle();

    return distinctIdentities;
  }

  async confirmIdentities(): Promise<void> {
    const distinctIdentities = await this.getDistinctIdentities();

    const heartbeatEntries = await this.nodeService.getHeartbeatValidatorsAndQueue();
    const blsIdentityDict = heartbeatEntries.filter(x => x.identity).toRecord(x => x.bls, x => x.identity ?? '');
    const confirmations: Record<string, string> = {};

    const providerAddresses = await this.providerService.getProviderAddresses();

    for (const identity of distinctIdentities) {
      await this.confirmIdentity(identity, providerAddresses, blsIdentityDict, confirmations);
    }

    for (const key of Object.keys(confirmations)) {
      await this.cachingService.set(CacheInfo.ConfirmedIdentity(key).key, confirmations[key], CacheInfo.ConfirmedIdentity(key).ttl);
    }
  }

  getOwners(identity: string): string[] | undefined {
    const info = this.readIdentityInfoFile(identity);
    if (!info || !info.owners) {
      return undefined;
    }

    return info.owners;
  }

  async confirmIdentity(identity: string, providerAddresses: string[], blsIdentityDict: Record<string, string>, confirmations: Record<string, string>): Promise<void> {
    const keys = this.getOwners(identity);
    if (!keys) {
      return;
    }

    for (const key of keys) {
      // key is a staking provider address
      if (AddressUtils.isAddressValid(key) && providerAddresses.includes(key)) {
        const providerMetadata = await this.providerService.getProviderMetadata(key);
        if (providerMetadata && providerMetadata.identity && providerMetadata.identity === identity) {
          await this.cachingService.set(CacheInfo.ConfirmedProvider(key).key, identity, CacheInfo.ConfirmedProvider(key).ttl);

          // if the identity is confirmed from the smart contract, we consider all BLS keys within valid
          const blses = await this.nodeService.getOwnerBlses(key);
          for (const bls of blses) {
            confirmations[bls] = identity;
          }
        }
      }

      // key is not a staking provider address
      if (AddressUtils.isAddressValid(key) && !providerAddresses.includes(key)) {
        const blses = await this.nodeService.getOwnerBlses(key);
        for (const bls of blses) {
          confirmations[bls] = identity;
        }
      }

      // key is a BLS
      if (key.length === 192 && blsIdentityDict[key] === identity && confirmations[key] === undefined) {
        confirmations[key] = identity;
      }
    }
  }

  async confirmIdentityProfiles(): Promise<void> {
    const identities = await this.getDistinctIdentities();

    await this.cachingService.batchProcess(
      identities,
      identity => CacheInfo.IdentityProfile(identity).key,
      // eslint-disable-next-line require-await
      async identity => this.getProfile(identity),
      Constants.oneDay(),
      true
    );
  }

  getProfile(identity: string): KeybaseIdentity | null {
    const keybaseLocal = this.getProfileFromAssets(identity);
    if (keybaseLocal) {
      this.logger.log(`Got profile details from assets for identity '${identity}'`);
      return keybaseLocal;
    }

    return null;
  }

  private readIdentityInfoFile(identity: string): any {
    const filePath = path.join(process.cwd(), 'dist/repos/assets/identities', identity, 'info.json');
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const info = JSON.parse(fs.readFileSync(filePath).toString());
    return info;
  }

  getProfileFromAssets(identity: string): KeybaseIdentity | null {
    const info = this.readIdentityInfoFile(identity);
    if (!info) {
      return null;
    }

    return new KeybaseIdentity({
      identity,
      avatar: `https://raw.githubusercontent.com/multiversx/mx-assets/master/identities/${identity}/logo.png`,
      ...info,
    });
  }
}
