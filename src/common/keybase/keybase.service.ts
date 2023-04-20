import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { KeybaseIdentity } from "./entities/keybase.identity";
import { CacheInfo } from "../../utils/cache.info";
import { GithubService } from "../github/github.service";
import { ApiService, ElrondCachingService, Constants, OriginLogger, AddressUtils } from "@multiversx/sdk-nestjs";
import { PersistenceService } from "../persistence/persistence.service";
import { ApiConfigService } from "../api-config/api.config.service";
import fs from 'fs';
import path from 'path';
@Injectable()
export class KeybaseService {
  private readonly logger = new OriginLogger(KeybaseService.name);

  constructor(
    private readonly cachingService: ElrondCachingService,
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService,
    private readonly githubService: GithubService,
    private readonly persistenceService: PersistenceService,
    private readonly apiConfigService: ApiConfigService,
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
          if (blsIdentityDict[bls] === identity && confirmations[bls] === undefined) {
            confirmations[bls] = identity;
          }
        }
      }

      // key is a BLS
      if (key.length === 192 && blsIdentityDict[key] === identity && confirmations[key] === undefined) {
        confirmations[key] = identity;
      }
    }
  }

  async confirmKeybasesAgainstGithub(): Promise<void> {
    const distinctIdentities = await this.getDistinctIdentities();

    for (const identity of distinctIdentities) {
      await this.confirmKeybasesAgainstGithubForIdentity(identity);
    }
  }

  async confirmKeybasesAgainstGithubForIdentity(identity: string): Promise<void> {
    try {
      const network = this.apiConfigService.getNetwork();
      const networkPath = network === 'mainnet' ? '' : `${network}/`;
      const filePath = networkPath + 'keys.json';

      const multiversxResults = await this.githubService.getRepoFileContents(identity, 'multiversx', filePath);
      if (!multiversxResults) {
        this.logger.log(`github.com validation not found for identity '${identity}'`);
        return;
      }

      const keys = JSON.parse(multiversxResults);

      this.logger.log(`github.com validation: for identity '${identity}', found ${keys.length} keys`);

      await this.cachingService.setRemote(CacheInfo.GithubKeysValidated(identity).key, Math.round(Date.now() / 1000), CacheInfo.GithubKeysValidated(identity).ttl);

      await this.persistenceService.setKeybaseConfirmationForIdentity(identity, keys);
    } catch (error) {
      this.logger.log(`github.com validation failure for identity '${identity}'`);
      this.logger.error(error);
    }
  }

  async confirmIdentityProfilesAgainstKeybaseIo(): Promise<void> {
    const identities = await this.getDistinctIdentities();

    await this.cachingService.batchProcess(
      identities,
      identity => CacheInfo.IdentityProfile(identity).key,
      async identity => await this.getProfile(identity),
      Constants.oneMonth() * 6,
      true
    );
  }

  async getProfile(identity: string): Promise<KeybaseIdentity | null> {
    const keybaseLocal = this.getProfileFromAssets(identity);
    if (keybaseLocal) {
      this.logger.log(`Got profile details from assets for identity '${identity}'`);
      return keybaseLocal;
    }

    const keybaseProfile = await this.getProfileFromKeybase(identity);
    if (keybaseProfile) {
      this.logger.log(`Got profile details from keybase.io for identity '${identity}'`);
    }

    const githubProfile = await this.getProfileFromGithub(identity);
    if (githubProfile) {
      this.logger.log(`Got profile details from github.com for identity '${identity}'`);
      await this.cachingService.setRemote(CacheInfo.GithubProfileValidated(identity).key, Math.round(Date.now() / 1000), CacheInfo.GithubProfileValidated(identity).ttl);
    }

    return githubProfile ?? keybaseProfile;
  }

  async getProfileFromGithub(identity: string): Promise<KeybaseIdentity | null> {
    const profile = await this.githubService.getUserInfo(identity);
    if (!profile || !profile.name || !profile.avatar_url || !profile.bio) {
      return null;
    }

    return {
      identity,
      name: profile.name,
      avatar: profile.avatar_url ?? undefined,
      description: profile.bio ?? undefined,
      location: profile.location ?? undefined,
      twitter: profile.twitter_username ?? undefined,
      website: profile.blog ?? undefined,
    };
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

  async getProfileFromKeybase(identity: string): Promise<KeybaseIdentity | null> {
    try {
      const { status, data } = await this.apiService.get(`https://keybase.io/_/api/1.0/user/lookup.json?username=${identity}`);

      if (status === HttpStatus.OK && data.status.code === 0) {
        const { profile, pictures } = data.them;

        const { proofs_summary } = data.them || {};
        const { all } = proofs_summary || {};

        const twitter = all.find((element: any) => element['proof_type'] === 'twitter');
        const website = all.find(
          (element: any) => element['proof_type'] === 'dns' || element['proof_type'] === 'generic_web_site'
        );

        return {
          identity,
          name: profile && profile.full_name ? profile.full_name : undefined,
          description: profile && profile.bio ? profile.bio : undefined,
          avatar:
            pictures && pictures.primary && pictures.primary.url ? pictures.primary.url : undefined,
          twitter: twitter && twitter.service_url ? twitter.service_url : undefined,
          website: website && website.service_url ? website.service_url : undefined,
          location: profile && profile.location ? profile.location : undefined,
        };
      }

      return null;
    } catch (error: any) {
      const cachedIdentityProfile = await this.cachingService.get<KeybaseIdentity>(CacheInfo.IdentityProfile(identity).key);
      return cachedIdentityProfile ? cachedIdentityProfile : null;
    }
  }
}
