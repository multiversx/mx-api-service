import { DynamicModule, Module, Provider, Type } from "@nestjs/common";
import configuration from "config/configuration";
import { GraphQlModule } from "src/common/graphql/graphql.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { MexEconomicsService } from "./mex.economics.service";
import { MexFarmService } from "./mex.farm.service";
import { MexPairService } from "./mex.pair.service";
import { MexSettingsService } from "./mex.settings.service";
import { MexTokenChartsService } from "./mex.token.charts.service";
import { MexTokenService } from "./mex.token.service";
import { MexWarmerService } from "./mex.warmer.service";
@Module({
  imports: [GraphQlModule], // mutat aici
  providers: [
    MexEconomicsService,
    MexSettingsService,
    MexPairService,
    MexTokenService,
    MexFarmService,
    MexTokenChartsService,
    DynamicModuleUtils.getPubSubService(),
  ],
  exports: [
    MexEconomicsService,
    MexPairService,
    MexSettingsService,
    MexTokenService,
    MexFarmService,
    MexTokenChartsService,
  ],
})
export class MexModule {
  static forRoot(): DynamicModule {
    const dynamicProviders: (Type<any> | Provider<any>)[] = [
    ];

    const isExchangeEnabled = configuration().features?.exchange?.enabled ?? false;
    if (isExchangeEnabled) {
      dynamicProviders.push(MexWarmerService);
    }

    return {
      module: MexModule,
      providers: dynamicProviders,
    };
  }
}