import { FileUtils } from "@multiversx/sdk-nestjs-common";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DappConfig } from "./entities/dapp-config";
import { GatewayService } from "src/common/gateway/gateway.service";

@Injectable()
export class DappConfigService {
  private readonly dappConfig: DappConfig | undefined;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly gatewayService: GatewayService,
  ) {
    this.dappConfig = this.getDappConfigurationRaw();
  }

  async getDappConfiguration(): Promise<DappConfig | undefined> {
    if (!this.dappConfig) {
      return undefined;
    }

    const networkConfig = await this.gatewayService.getNetworkConfig();
    const refreshRate = networkConfig.erd_round_duration;

    if (refreshRate) {
      return {
        ...this.dappConfig,
        refreshRate,
      };
    }

    return this.dappConfig;
  }

  getDappConfigurationRaw(): DappConfig | undefined {
    const network = this.apiConfigService.getNetwork();
    const configuration = FileUtils.parseJSONFile(`./config/dapp.config.${network}.json`);

    return configuration;
  }
}
