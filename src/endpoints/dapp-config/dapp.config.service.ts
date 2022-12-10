import { CachingService, Constants, FileUtils } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DappConfig } from "./entities/dapp-config";

@Injectable()
export class DappConfigService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
  ) { }

  async getDappConfiguration(): Promise<DappConfig | undefined> {
    return await this.cachingService.getOrSetCache(
      'dappConfig',
      async () => await this.getDappConfigurationRaw(),
      Constants.oneHour(),
      Constants.oneMinute()
    );
  }

  getDappConfigurationRaw(): DappConfig | undefined {
    const network = this.apiConfigService.getNetwork();
    const configuration = FileUtils.parseJSONFile(`./config/dapp.config.${network}.json`);

    return configuration;
  }
}
