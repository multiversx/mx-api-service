import { Resolver, Query } from "@nestjs/graphql";
import { DappConfigService } from "src/endpoints/dapp-config/dapp.config.service";
import { DappConfig } from "src/endpoints/dapp-config/entities/dapp-config";

@Resolver()
export class DappConfigQuery {
  constructor(protected readonly dappConfigService: DappConfigService) { }

  @Query(() => DappConfig, { name: "dappConfig", description: "Retrieve configuration used in dapp." })
  public async getDappConfig(): Promise<DappConfig> {
    return await this.dappConfigService.getDappConfiguration();
  }
}
