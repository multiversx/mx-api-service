import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ApiConfigService } from "./api.config.service";
import { ApiService } from "./api.service";
import { CachingService } from "./caching.service";
import { Keybase } from "./entities/keybase";
import { KeybaseState } from "./entities/keybase.state";
import { oneMonth } from "./helpers";

@Injectable()
export class KeybaseService {
  private readonly logger: Logger

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
  ) {
    this.logger = new Logger(KeybaseService.name);
  }

  async confirmKeybasesRaw() {
    let nodes = await this.nodeService.getHeartbeat();

    const keybasesArr: Keybase[] = nodes
      .filter((node) => !!node.identity)
      .map((node) => {
        return { identity: node.identity, key: node.bls };
      });

    const confirmedKeybases =  await this.cachingService.batchProcess(
      keybasesArr,
      keybase => `keybase:${keybase.key}`,
      async (keybase) => await this.confirmKeybase(keybase),
      oneMonth() * 6,
      true
    );

    const keybases: { [key: string]: KeybaseState } = {};

    keybasesArr.forEach((keybase, index) => {
      let keybaseState = new KeybaseState();
      keybaseState.identity = keybase.identity;

      keybases[keybase.key] = keybaseState;

      if (confirmedKeybases[index]) {
        keybases[keybase.key].confirmed = true;
        // this.logger.log(`Confirmed keybase for identity ${keybase.identity} and key ${keybase.key}`);
      } else {
        keybases[keybase.key].confirmed = false;
        this.logger.log(`Unconfirmed keybase for identity ${keybase.identity} and key ${keybase.key}`);
      }
    });

    return keybases;
  }

  async getCachedKeybases(): Promise<{ [key: string]: KeybaseState } | undefined> {
    return await this.cachingService.getCache('keybases');
  }

  private async confirmKeybase(keybase: Keybase): Promise<boolean> {
    if (!keybase.identity) {
      return false;
    }

    try {
      const url = this.apiConfigService.getNetwork() === 'mainnet'
          ? `https://keybase.pub/${keybase.identity}/elrond/${keybase.key}`
          : `https://keybase.pub/${keybase.identity}/elrond/${this.apiConfigService.getNetwork()}/${keybase.key}`;
  
      this.logger.log(`Fetching keybase for identity ${keybase.identity} and key ${keybase.key}`);

      const { status } = await this.apiService.head(url);

      return status === 200;
    } catch (error) {
      return false;
    }
  };

  async getProfile(identity: string) {
    let value;
  
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
      } else {
        value = false;
      }
    } catch (error) {
      value = false;
    }
  
    return value;
  };
}