import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "./api.config.service";
import { ApiService } from "./api.service";
import { CachingService } from "./caching.service";
import { Keybase } from "./entities/keybase";
import { oneWeek } from "./helpers";

@Injectable()
export class KeybaseService {
  // private readonly logger: Logger

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly apiService: ApiService
  ) {
    // this.logger = new Logger(KeybaseService.name);
  }

  async confirmKeybases(keybases: Keybase[]): Promise<boolean[]> {
    return await this.cachingService.batchProcess(
      keybases,
      keybase => `keybase:${keybase.identity}:${keybase.key}`,
      async (keybase) => await this.confirmKeybase(keybase),
      oneWeek(),
    );
  }

  async confirmKeybase(keybase: Keybase): Promise<boolean> {
    if (!keybase.identity) {
      return false;
    }

    try {
      // const url = this.apiConfigService.getNetwork() === 'mainnet'
      //     ? `https://keybase.pub/${keybase.identity}/elrond/${keybase.key}`
      //     : `https://keybase.pub/${keybase.identity}/elrond/${this.apiConfigService.getNetwork()}/${keybase.key}`;
  
      // this.logger.log(`Fetching keybase for identity ${keybase.identity} and key ${keybase.key}`);

      // const { status } = await this.apiService.head(url);

      // return status === 200;
      return true;
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