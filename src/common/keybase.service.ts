import { forwardRef, /*HttpStatus, */Inject, Injectable, Logger } from "@nestjs/common";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { Constants } from "src/utils/constants";
// import { ApiConfigService } from "./api.config.service";
import { ApiService } from "./api.service";
import { CachingService } from "./caching.service";
import { Keybase } from "./entities/keybase";
import { KeybaseIdentity } from "./entities/keybase.identity";
import { KeybaseState } from "./entities/keybase.state";

@Injectable()
export class KeybaseService {
  private readonly logger: Logger

  constructor(
    // private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService
  ) {
    this.logger = new Logger(KeybaseService.name);
  }

  async confirmKeybasesAgainstCache(): Promise<{ [key: string]: KeybaseState }> {
    let nodes = await this.nodeService.getHeartbeat();

    const keybasesArr: Keybase[] = nodes
      .filter((node) => !!node.identity)
      .map((node) => {
        return { identity: node.identity, key: node.bls };
      });

    let keybaseGetPromises = keybasesArr.map(keybase => this.cachingService.getCache<boolean>(`keybase:${keybase.key}`));
    let keybaseGetResults = await Promise.all(keybaseGetPromises);

    let confirmedKeybases = keybasesArr.zip<(boolean | undefined), KeybaseState>(keybaseGetResults, (first, second) => ({ identity: first.identity, confirmed: second ?? false }));

    let result: { [key: string]: KeybaseState } = {};
    for (let [index, confirmedKeybase] of confirmedKeybases.entries()) {
      let bls = keybasesArr[index].key;
      if (bls !== undefined) {
        result[bls] = confirmedKeybase;
      }
    }

    return result;
  }

  async confirmKeybaseProvidersAgainstKeybasePub() {
    const providers = await this.providerService.getProviderAddresses();

    const metadatas = await 
      this.cachingService.batchProcess(
        providers,
        address => `providerMetadata:${address}`,
        async address => await this.providerService.getProviderMetadata(address),
        Constants.oneMinute() * 15,
      );

    const keybaseArr: Keybase[] = metadatas
      .map(({ identity }, index) => {
        return { identity: identity ?? '', key: providers[index] };
      })
      .filter(({ identity }) => !!identity);

    const confirmedKeybases = await this.cachingService.batchProcess(
      keybaseArr,
      keybase => `keybase:${keybase.key}`,
      async (keybase) => await this.confirmKeybase(keybase),
      Constants.oneMonth() * 6,
      true
    );

    const keybases: { [key: string]: KeybaseState } = {};

    keybaseArr.forEach((keybase, index) => {
      let keybaseState = new KeybaseState();
      keybaseState.identity = keybase.identity;

      if (confirmedKeybases[index]) {
        keybaseState.confirmed = true;
        // this.logger.log(`Confirmed keybase for identity ${keybase.identity} and key ${keybase.key}`);
      } else {
        keybaseState.confirmed = false;
        this.logger.log(`Unconfirmed keybase for identity ${keybase.identity} and key ${keybase.key}`);
      }

      keybases[keybase.key] = keybaseState;
    });

    return keybases;
  }

  async confirmKeybaseNodesAgainstKeybasePub() {
    let nodes = await this.nodeService.getHeartbeat();

    const keybasesArr: Keybase[] = nodes
      .filter((node) => !!node.identity)
      .map((node) => {
        return { identity: node.identity, key: node.bls };
      });

    const confirmedKeybases = await this.cachingService.batchProcess(
      keybasesArr,
      keybase => `keybase:${keybase.key}`,
      async (keybase) => await this.confirmKeybase(keybase),
      Constants.oneMonth() * 6,
      true
    );

    const keybases: { [key: string]: KeybaseState } = {};

    keybasesArr.forEach((keybase, index) => {
      let keybaseState = new KeybaseState();
      keybaseState.identity = keybase.identity;

      if (confirmedKeybases[index]) {
        keybaseState.confirmed = true;
        // this.logger.log(`Confirmed keybase for identity ${keybase.identity} and key ${keybase.key}`);
      } else {
        keybaseState.confirmed = false;
        this.logger.log(`Unconfirmed keybase for identity ${keybase.identity} and key ${keybase.key}`);
      }

      keybases[keybase.key] = keybaseState;
    });

    return keybases;
  }

  async getIdentitiesProfilesAgainstKeybasePub(): Promise<KeybaseIdentity[]> {
    let nodes = await this.nodeService.getAllNodes();

    let keys = [
      ...new Set(nodes.filter(({ identity }) => !!identity).map(({ identity }) => identity)),
    ].filter(x => x !== null).map(x => x ?? '');

    let identities: KeybaseIdentity[] = await this.cachingService.batchProcess(
      keys,
      key => `identityProfile:${key}`,
      async key => await this.getProfile(key) ?? new KeybaseIdentity(),
      Constants.oneMinute() * 30,
      true
    );

    return identities;
  }

  async getCachedIdentityKeybases(): Promise<KeybaseIdentity[]> {
    return await this.cachingService.getOrSetCache(
      'identityKeybases',
      async () => await this.getIdentitiesProfilesAgainstKeybasePub(),
      Constants.oneHour()
    );
  }

  async getCachedNodeKeybases(): Promise<{ [key: string]: KeybaseState } | undefined> {
    return await this.cachingService.getOrSetCache(
      'nodeKeybases',
      async () => await this.confirmKeybaseNodesAgainstKeybasePub(),
      Constants.oneHour()
    );
  }

  async confirmKeybase(keybase: Keybase): Promise<boolean> {
    if (!keybase.identity) {
      return false;
    }

    // try {
    //   const url = this.apiConfigService.getNetwork() === 'mainnet'
    //       ? `https://keybase.pub/${keybase.identity}/elrond/${keybase.key}`
    //       : `https://keybase.pub/${keybase.identity}/elrond/${this.apiConfigService.getNetwork()}/${keybase.key}`;
  
    //   this.logger.log(`Fetching keybase for identity ${keybase.identity} and key ${keybase.key}`);

    //   const { status } = await this.apiService.head(url, undefined, async (error: any) => {
    //     if (error.response?.status === HttpStatus.NOT_FOUND) {
    //       this.logger.log(`Keybase not found for identity ${keybase.identity} and key ${keybase.key}`);
    //       return true;
    //     }

    //     return false;
    //   });
    //   return status === 200;
    // } catch (error) {
    //   return false;
    // }

    return true;
  };

  async getProfile(identity: string): Promise<KeybaseIdentity | undefined> {
    let value: KeybaseIdentity | undefined;
  
    try {
      const { status, data } = await this.apiService.get(
        `https://keybase.io/_/api/1.0/user/lookup.json?username=${identity}`
      );
  
      if (status === 200 && data.status.code === 0) {
        const { profile, pictures } = data.them;
  
        const { proofs_summary } = data.them || {};
        const { all } = proofs_summary || {};
  
        const twitter = all.find((element: any) => element['proof_type'] === 'twitter');
        const website = all.find(
          (element: any) => element['proof_type'] === 'dns' || element['proof_type'] === 'generic_web_site'
        );
  
        value = {
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
    } catch (error) {
      return value;
    }
  
    return value;
  };
}