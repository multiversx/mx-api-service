import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { KeybaseIdentity } from "./entities/keybase.identity";
import { CacheInfo } from "../../utils/cache.info";
import fs from 'fs';
import { readdir } from 'fs/promises';
import { AssetsService } from "../assets/assets.service";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { AddressUtils, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ApiConfigService } from "../api-config/api.config.service";

@Injectable()
export class KeybaseService {
  private readonly logger = new OriginLogger(KeybaseService.name);

  constructor(
    private readonly cachingService: CacheService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService,
    private readonly assetsService: AssetsService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  private async getDistinctIdentities(): Promise<string[]> {
    const dirContents = await readdir(this.assetsService.getIdentityAssetsPath(), { withFileTypes: true });

    const identities = dirContents
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    return identities;
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
      if (AddressUtils.isAddressValid(key)) {
        if (providerAddresses.includes(key)) {
          await this.cachingService.set(CacheInfo.ConfirmedProvider(key).key, identity, CacheInfo.ConfirmedProvider(key).ttl);
        }

        // if the identity is confirmed from the smart contract, we consider all BLS keys within valid
        try {
          const blses = await this.nodeService.getOwnerBlses(key);
          this.logger.log(`Confirmed identity '${identity}' for address '${key}' with ${blses.length} BLS keys`);

          for (const bls of blses) {
            confirmations[bls] = identity;
          }
        } catch (error) {
          this.logger.error(`Failed to get BLS keys for address ${key}`);
          this.logger.error(error);
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
    const keybaseIdentities = identities.map(identity => this.getProfile(identity));
    await this.cachingService.set(CacheInfo.IdentityProfilesKeybases.key, keybaseIdentities, CacheInfo.IdentityProfilesKeybases.ttl);
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
    const filePath = this.assetsService.getIdentityInfoJsonPath(identity);
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

    const network = this.apiConfigService.getNetwork();
    const folder = network === 'mainnet' ? '' : `/${network}`;

    return new KeybaseIdentity({
      identity,
      avatar: `https://raw.githubusercontent.com/multiversx/mx-assets/master${folder}/identities/${identity}/logo.png`,
      ...info,
    });
  }
}
