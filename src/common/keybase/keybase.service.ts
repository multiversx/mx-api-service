import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { Keybase } from "./entities/keybase";
import { KeybaseIdentity } from "./entities/keybase.identity";
import { KeybaseState } from "./entities/keybase.state";
import { CacheInfo } from "../../utils/cache.info";
import { GithubService } from "../github/github.service";
import { ApiService, ApiUtils, ElrondCachingService, Constants, OriginLogger } from "@multiversx/sdk-nestjs";
import { PersistenceService } from "../persistence/persistence.service";

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
    private readonly persistenceService: PersistenceService
  ) { }

  private async getProvidersKeybasesRaw(): Promise<Keybase[]> {
    const providers = await this.providerService.getProviderAddresses();
    const metadatas = await
      this.cachingService.batchProcess(
        providers,
        address => `providerMetadata:${address}`,
        async address => await this.providerService.getProviderMetadata(address),
        Constants.oneMinute() * 15,
      );

    const keybaseProvidersArr: Keybase[] = metadatas
      .map(({ identity }, index) => {
        return { identity: identity ?? '', key: providers[index] };
      })
      .filter(({ identity }) => !!identity);

    return keybaseProvidersArr;
  }

  private async getNodesKeybasesRaw(): Promise<Keybase[]> {
    const nodes = await this.nodeService.getHeartbeat();
    const keybasesNodesArr: Keybase[] = nodes
      .filter((node) => !!node.identity)
      .map((node) => {
        return { identity: node.identity, key: node.bls };
      });

    return keybasesNodesArr;
  }

  async confirmKeybasesAgainstCache(): Promise<{ [key: string]: KeybaseState }> {
    const keybaseProvidersArr: Keybase[] = await this.getProvidersKeybasesRaw();
    const keybasesNodesArr: Keybase[] = await this.getNodesKeybasesRaw();

    const keybasesArr: Keybase[] = [...keybaseProvidersArr, ...keybasesNodesArr];

    const keybaseGetPromises = keybasesArr.map(keybase => this.cachingService.get<boolean>(CacheInfo.KeybaseConfirmation(keybase.key).key));
    const keybaseGetResults = await Promise.all(keybaseGetPromises);

    const confirmedKeybases = keybasesArr.zip<(boolean | undefined), KeybaseState>(keybaseGetResults, (first, second) => ({ identity: first.identity, confirmed: second ?? false }));

    const keybasesDict: { [key: string]: KeybaseState } = {};
    for (const [index, confirmedKeybase] of confirmedKeybases.entries()) {
      const key = keybasesArr[index].key;
      if (key !== undefined) {
        const keybaseState = ApiUtils.mergeObjects(new KeybaseState(), confirmedKeybase);
        keybasesDict[key] = keybaseState;
      }
    }

    return keybasesDict;
  }

  async getIdentitiesProfilesAgainstCache(): Promise<KeybaseIdentity[]> {
    const nodes = await this.nodeService.getAllNodes();

    const keys = nodes.map((node) => node.identity).distinct().map((x) => x ?? '');

    const keybaseGetPromises = keys.map(key => this.cachingService.get<KeybaseIdentity>(CacheInfo.IdentityProfile(key).key));
    const keybaseGetResults = await Promise.all(keybaseGetPromises);

    // @ts-ignore
    return keybaseGetResults.filter(x => x !== undefined && x !== null);
  }

  private async getDistinctIdentities(): Promise<string[]> {
    const providerKeybases: Keybase[] = await this.getProvidersKeybasesRaw();
    const nodeKeybases: Keybase[] = await this.getNodesKeybasesRaw();
    const allKeybases: Keybase[] = [...providerKeybases, ...nodeKeybases];

    const distinctIdentities = allKeybases.map(x => x.identity ?? '').filter(x => x !== '').distinct().shuffle();

    return distinctIdentities;
  }

  async confirmKeybasesAgainstDatabase(): Promise<void> {
    const distinctIdentities = await this.getDistinctIdentities();

    for (const identity of distinctIdentities) {
      await this.confirmKeybasesAgainstDatabaseForIdentity(identity);
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
      const multiversxResults = await this.githubService.getRepoFileContents(identity, 'multiversx', 'keys.json');
      if (!multiversxResults) {
        this.logger.log(`github.com validation not found for identity '${identity}'`);
        return;
      }

      const keys = JSON.parse(multiversxResults);

      this.logger.log(`github.com validation: for identity '${identity}', found ${keys.length} keys`);

      await this.cachingService.batchProcess(
        keys,
        (key: string) => CacheInfo.KeybaseConfirmation(key).key,
        async () => await true,
        CacheInfo.KeybaseConfirmation('*').ttl,
        true
      );

      await this.persistenceService.setKeybaseConfirmationForIdentity(identity, keys);
    } catch (error) {
      this.logger.log(`github.com validation failure for identity '${identity}'`);
      this.logger.error(error);
    }
  }

  async confirmKeybasesAgainstDatabaseForIdentity(identity: string): Promise<boolean> {
    try {
      const keys = await this.persistenceService.getKeybaseConfirmationForIdentity(identity);
      if (!keys) {
        return false;
      }

      this.logger.log(`database validation: for identity '${identity}', found ${keys.length} keys`);

      await this.cachingService.batchProcess(
        keys,
        (key: string) => CacheInfo.KeybaseConfirmation(key).key,
        async () => await true,
        CacheInfo.KeybaseConfirmation('*').ttl,
        true
      );

      return true;
    } catch (error) {
      this.logger.log(`Error when confirming keybase against database for identity '${identity}'`);
      this.logger.error(error);
      return false;
    }
  }

  async confirmIdentityProfilesAgainstKeybaseIo(): Promise<void> {
    const nodes = await this.nodeService.getAllNodes();

    const keys = nodes.map((node) => node.identity).distinct().map(x => x ?? '');

    await this.cachingService.batchProcess(
      keys,
      key => CacheInfo.IdentityProfile(key).key,
      async key => await this.getProfile(key),
      Constants.oneMonth() * 6,
      true
    );
  }

  async getCachedIdentityProfilesKeybases(): Promise<KeybaseIdentity[]> {
    return await this.cachingService.getOrSet(
      CacheInfo.IdentityProfilesKeybases.key,
      async () => await this.getIdentitiesProfilesAgainstCache(),
      CacheInfo.IdentityProfilesKeybases.ttl
    );
  }

  async getCachedNodesAndProvidersKeybases(): Promise<{ [key: string]: KeybaseState } | undefined> {
    return await this.cachingService.getOrSet(
      CacheInfo.Keybases.key,
      async () => await this.confirmKeybasesAgainstCache(),
      CacheInfo.Keybases.ttl
    );
  }

  async getProfile(identity: string): Promise<KeybaseIdentity | null> {
    const keybaseProfile = await this.getProfileFromKeybase(identity);
    if (keybaseProfile) {
      this.logger.log(`Got profile details from keybase.io for identity '${identity}'`);
      return keybaseProfile;
    }

    const githubProfile = await this.getProfileFromGithub(identity);
    if (githubProfile) {
      this.logger.log(`Got profile details from github.com for identity '${identity}'`);
      return githubProfile;
    }

    return null;
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
