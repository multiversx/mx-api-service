import { FileUtils } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DappConfig } from "./entities/dapp-config";

@Injectable()
export class DappConfigService {
  constructor(
    private readonly apiConfigService: ApiConfigService
  ) { }

  getDappConfiguration(): DappConfig | undefined {
    const network = this.apiConfigService.getNetwork();
    const configuration = FileUtils.parseJSONFile(`./config/dapp.config.${network}.json`);

    return configuration;
  }
}
