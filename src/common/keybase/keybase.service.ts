import { forwardRef, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { ApiUtils } from "src/utils/api.utils";
import { Constants } from "src/utils/constants";
import { ApiConfigService } from "../api-config/api.config.service";
import { CachingService } from "../caching/caching.service";
import { Keybase } from "./entities/keybase";
import { KeybaseIdentity } from "./entities/keybase.identity";
import { KeybaseState } from "./entities/keybase.state";
import { ApiService } from "../network/api.service";
import { CacheInfo } from "../caching/entities/cache.info";

@Injectable()
export class KeybaseService {
  private readonly logger: Logger

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService
  ) {
    this.logger = new Logger(KeybaseService.name);
  }

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
    let nodes = await this.nodeService.getHeartbeat();

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

    let keybaseGetPromises = keybasesArr.map(keybase => this.cachingService.getCache<boolean>(CacheInfo.KeybaseConfirmation(keybase.key).key));
    let keybaseGetResults = await Promise.all(keybaseGetPromises);

    let confirmedKeybases = keybasesArr.zip<(boolean | undefined), KeybaseState>(keybaseGetResults, (first, second) => ({ identity: first.identity, confirmed: second ?? false }));

    let keybasesDict: { [key: string]: KeybaseState } = {};
    for (let [index, confirmedKeybase] of confirmedKeybases.entries()) {
      let key = keybasesArr[index].key;
      if (key !== undefined) {
        let keybaseState = ApiUtils.mergeObjects(new KeybaseState(), confirmedKeybase);
        keybasesDict[key] = keybaseState;
      }
    }

    return keybasesDict;
  }

  async getIdentitiesProfilesAgainstCache(): Promise<KeybaseIdentity[]> {
    let nodes = await this.nodeService.getAllNodes();

    let keys = [
      ...new Set(nodes.filter(({ identity }) => !!identity).map(({ identity }) => identity)),
    ].filter(x => x !== null).map(x => x ?? '');

    let keybaseGetPromises = keys.map(key => this.cachingService.getCache<KeybaseIdentity>(CacheInfo.IdentityProfile(key).key));
    let keybaseGetResults = await Promise.all(keybaseGetPromises);

    // @ts-ignore
    return keybaseGetResults.filter(x => x !== undefined && x !== null);
  }

  async confirmKeybasesAgainstKeybasePub(): Promise<void> {
    const isKeybaseUp = await this.isKeybaseUp();
    if (!isKeybaseUp) {
      return;
    }

    const keybaseProvidersArr: Keybase[] = await this.getProvidersKeybasesRaw();
    const keybasesNodesArr: Keybase[] = await this.getNodesKeybasesRaw();

    const keybasesArr: Keybase[] = [...keybaseProvidersArr, ...keybasesNodesArr];

    await this.cachingService.batchProcess(
      keybasesArr,
      keybase => CacheInfo.KeybaseConfirmation(keybase.key).key,
      async (keybase) => await this.confirmKeybase(keybase),
      Constants.oneMonth() * 6,
      true
    );
  }

  async confirmIdentityProfilesAgainstKeybasePub(): Promise<void> {
    const isKeybaseUp = await this.isKeybaseUp();
    if (!isKeybaseUp) {
      return;
    }
    
    let nodes = await this.nodeService.getAllNodes();

    let keys = [
      ...new Set(nodes.filter(({ identity }) => !!identity).map(({ identity }) => identity)),
    ].filter(x => x !== null).map(x => x ?? '');

    await this.cachingService.batchProcess(
      keys,
      key => CacheInfo.IdentityProfile(key).key,
      async key => await this.getProfile(key),
      Constants.oneMonth() * 6,
      true
    );
  }

  async getCachedIdentityProfilesKeybases(): Promise<KeybaseIdentity[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.IdentityProfilesKeybases.key,
      async () => await this.getIdentitiesProfilesAgainstCache(),
      CacheInfo.IdentityProfilesKeybases.ttl
    );
  }

  async getCachedNodesAndProvidersKeybases(): Promise<{ [key: string]: KeybaseState } | undefined> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.Keybases.key,
      async () => await this.confirmKeybasesAgainstCache(),
      CacheInfo.Keybases.ttl
    );
  }

  async isKeybaseUp(): Promise<boolean> {
    try {
      const { status } = await this.apiService.head('https://keybase.pub');
      return status === HttpStatus.OK;
    } catch (error) {
      return false;
    }
  }

  async confirmKeybase(keybase: Keybase): Promise<boolean> {
    if (!keybase.identity) {
      return false;
    }

    try {
      const url = this.apiConfigService.getNetwork() === 'mainnet'
          ? `https://keybase.pub/${keybase.identity}/elrond/${keybase.key}`
          : `https://keybase.pub/${keybase.identity}/elrond/${this.apiConfigService.getNetwork()}/${keybase.key}`;
  
      this.logger.log(`Fetching keybase for identity ${keybase.identity} and key ${keybase.key}`);

      const { status } = await this.apiService.head(url);
      return status === HttpStatus.OK;
    } catch (error: any) {
      if (error.response?.status === HttpStatus.NOT_FOUND) {
        this.logger.log(`Keybase not found for identity ${keybase.identity} and key ${keybase.key}`);
        return false
      }

      const cachedConfirmation = await this.cachingService.getCache<boolean>(CacheInfo.KeybaseConfirmation(keybase.key).key);
      return cachedConfirmation !== undefined && cachedConfirmation !== null ? cachedConfirmation : false;
    }
  };

  async getProfile(identity: string): Promise<KeybaseIdentity | null> {
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
      const cachedIdentityProfile = await this.cachingService.getCache<KeybaseIdentity>(CacheInfo.IdentityProfile(identity).key)
      return cachedIdentityProfile ? cachedIdentityProfile : null;
    }
  };
}