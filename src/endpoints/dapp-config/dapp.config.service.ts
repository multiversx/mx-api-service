import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { FileUtils } from '../../utils/file.utils';

@Injectable()
export class DappConfigService {
  constructor(
    private readonly apiConfigService: ApiConfigService
  ) { }

  getDappConfiguration(): any | undefined {
    const network = this.apiConfigService.getNetwork();
    const configuration = FileUtils.parseJSONFile(`./config/dapp.config.${network}.json`);

    return configuration;
  }
}
