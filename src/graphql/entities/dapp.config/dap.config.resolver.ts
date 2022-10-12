import { Resolver } from "@nestjs/graphql";
import { DappConfig } from "src/endpoints/dapp-config/entities/dapp-config";
import { DappConfigQuery } from "./dapp.config.query";
import { DappConfigService } from "src/endpoints/dapp-config/dapp.config.service";

@Resolver(() => DappConfig)
export class DappConfigResolver extends DappConfigQuery {
  constructor(dapConfigService: DappConfigService) {
    super(dapConfigService);
  }
}
