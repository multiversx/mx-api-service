import { Injectable, Logger } from "@nestjs/common";
import { DappNetwork } from "./entities/dapp.network";
import { FileUtils } from '../../utils/file.utils';

@Injectable()
export class DappConfigService {
  private logger: Logger;
  constructor(
  ) {
    this.logger = new Logger(DappConfigService.name);
  }

  getDappConfiguration(network: DappNetwork): any | undefined {
    try {
      const configuration = FileUtils.parseJSONFile(`./config/dapp.config.${network}.json`);

      return configuration;
    } catch (error) {
      this.logger.log(`Error when trying to extract dapp configuration for network ${network}.`);

      return undefined;
    }
  }
}
