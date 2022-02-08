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
import { ApiSettings } from "../network/entities/api.settings";
import asyncPool from "tiny-async-pool";

@Injectable()
export class KeybaseService {
  private readonly logger: Logger;

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

    const keybaseGetPromises = keybasesArr.map(keybase => this.cachingService.getCache<boolean>(CacheInfo.KeybaseConfirmation(keybase.key).key));
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

    const keybaseGetPromises = keys.map(key => this.cachingService.getCache<KeybaseIdentity>(CacheInfo.IdentityProfile(key).key));
    const keybaseGetResults = await Promise.all(keybaseGetPromises);

    // @ts-ignore
    return keybaseGetResults.filter(x => x !== undefined && x !== null);
  }

  async confirmKeybasesAgainstKeybasePub(): Promise<void> {
    const isKeybaseUp = await this.isKeybasePubUp();
    if (!isKeybaseUp) {
      return;
    }

    const providerKeybases: Keybase[] = await this.getProvidersKeybasesRaw();
    const nodeKeybases: Keybase[] = await this.getNodesKeybasesRaw();

    const allKeybases: Keybase[] = [...providerKeybases, ...nodeKeybases];

    const distinctIdentities = allKeybases.map(x => x.identity ?? '').filter(x => x !== '').distinct();

    await asyncPool(
      1,
      distinctIdentities,
      identity => this.confirmKeybasesAgainstKeybasePubForIdentity(identity)
    );
  }

  async confirmKeybasesAgainstKeybasePubForIdentity(identity: string): Promise<void> {
    // eslint-disable-next-line require-await
    const result = await this.apiService.get(`https://keybase.pub/${identity}/elrond`, { timeout: 100000 }, async (error) => error.response?.status === HttpStatus.NOT_FOUND);

    if (!result) {
      this.logger.log(`For identity '${identity}', no keybase.pub entry was found`);
      return;
    }

    const html = result.data;

    const nodesRegex = new RegExp("https:\/\/keybase.pub\/" + identity + "\/elrond\/[0-9a-f]{192}", 'g');
    const blses: string[] = [];
    for (const keybaseUrl of html.match(nodesRegex) || []) {
      const bls = keybaseUrl.match(/[0-9a-f]{192}/)[0];
      blses.push(bls);
    }

    const providersRegex = new RegExp("https:\/\/keybase.pub\/" + identity + "\/elrond\/erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq[0-9a-z]{13}", 'g');
    const addresses: string[] = [];
    for (const keybaseUrl of html.match(providersRegex) || []) {
      const bls = keybaseUrl.match(/erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq[0-9a-z]{13}/)[0];
      addresses.push(bls);
    }

    this.logger.log(`For identity '${identity}', found ${blses.length} blses and addresses ${addresses}`);

    await this.cachingService.batchProcess(
      [...blses, ...addresses],
      key => `keybase:${key}`,
      async () => await true,
      Constants.oneMonth() * 6,
      true
    );
  }


  async confirmIdentityProfilesAgainstKeybaseIo(): Promise<void> {
    const isKeybaseUp = await this.isKeybaseIoUp();
    if (!isKeybaseUp) {
      return;
    }

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

  async isKeybasePubUp(): Promise<boolean> {
    try {
      const { status } = await this.apiService.head('https://keybase.pub');
      return status === HttpStatus.OK;
    } catch (error) {
      this.logger.error('It seems that keybase.pub is down');
      return false;
    }
  }

  async isKeybaseIoUp(): Promise<boolean> {
    try {
      const { status } = await this.apiService.head('https://keybase.io');
      return status === HttpStatus.OK;
    } catch (error) {
      this.logger.error('It seems that keybase.io is down');
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

      // eslint-disable-next-line require-await
      const { status } = await this.apiService.head(url, new ApiSettings(), async (error) => {
        if (error.response?.status === HttpStatus.NOT_FOUND) {
          throw error;
        }

        return false;
      });
      return status === HttpStatus.OK;
    } catch (error: any) {
      if (error.response?.status === HttpStatus.NOT_FOUND) {
        this.logger.log(`Keybase not found for identity ${keybase.identity} and key ${keybase.key}`);
        return false;
      }

      const cachedConfirmation = await this.cachingService.getCache<boolean>(CacheInfo.KeybaseConfirmation(keybase.key).key);
      return cachedConfirmation !== undefined && cachedConfirmation !== null ? cachedConfirmation : false;
    }
  }

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
      const cachedIdentityProfile = await this.cachingService.getCache<KeybaseIdentity>(CacheInfo.IdentityProfile(identity).key);
      return cachedIdentityProfile ? cachedIdentityProfile : null;
    }
  }
}
