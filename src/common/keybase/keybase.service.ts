import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { KeybaseIdentity } from "./entities/keybase.identity";
import { CacheInfo } from "../../utils/cache.info";
import { GithubService } from "../github/github.service";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Constants, OriginLogger, AddressUtils } from "@multiversx/sdk-nestjs-common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { PersistenceService } from "../persistence/persistence.service";
import { ApiConfigService } from "../api-config/api.config.service";

@Injectable()
export class KeybaseService {
  private readonly logger = new OriginLogger(KeybaseService.name);

  constructor(
    private readonly cachingService: CacheService,
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

    for (const identity of distinctIdentities) {
      await this.confirmIdentity(identity, blsIdentityDict, confirmations);
    }

    for (const key of Object.keys(confirmations)) {
      await this.cachingService.set(CacheInfo.ConfirmedIdentity(key).key, confirmations[key], CacheInfo.ConfirmedIdentity(key).ttl);
    }
  }

  async confirmIdentity(identity: string, blsIdentityDict: Record<string, string>, confirmations: Record<string, string>): Promise<void> {
    const keys = await this.persistenceService.getKeybaseConfirmationForIdentity(identity);
    if (!keys) {
      return;
    }

    for (const key of keys) {
      if (AddressUtils.isAddressValid(key)) {
        const providerMetadata = await this.providerService.getProviderMetadata(key);
        if (providerMetadata && providerMetadata.identity && providerMetadata.identity === identity) {
          await this.cachingService.set(CacheInfo.ConfirmedProvider(key).key, identity, CacheInfo.ConfirmedProvider(key).ttl);

          // if the identity is confirmed from the smart contract, we consider all BLS keys within valid
          const blses = await this.nodeService.getOwnerBlses(key);
          for (const bls of blses) {
            confirmations[bls] = identity;
          }
        }
      } else if (blsIdentityDict[key] === identity && confirmations[key] === undefined) {
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
