import { Injectable } from "@nestjs/common";
import axios from "axios";
import { ApiConfigService } from "./api.config.service";
import { CachingService } from "./caching.service";
import { Keybase } from "./entities/keybase";
import { oneWeek } from "./helpers";

@Injectable()
export class KeybaseService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
  ) {}

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
      const url = this.apiConfigService.getNetwork() === 'mainnet'
          ? `https://keybase.pub/${keybase.identity}/elrond/${keybase.key}`
          : `https://keybase.pub/${keybase.identity}/elrond/${this.apiConfigService.getNetwork()}/${keybase.key}`;
  
      console.log(`Fetching keybase for identity ${keybase.identity} and key ${keybase.key}`);

      const { status } = await axios.head(url);

      return status === 200;
    } catch (error) {
      return false;
    }
  };
}