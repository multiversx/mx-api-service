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

@Module({})
export class MexModule {
  static forRoot(): DynamicModule {
    const providers: (Type<any> | Provider<any>)[] = [
      DynamicModuleUtils.getPubSubService(),
      MexEconomicsService,
      MexSettingsService,
      MexPairService,
      MexTokenService,
      MexFarmService,
      MexTokenChartsService,
    ];

    const isExchangeEnabled = configuration().features?.exchange?.enabled ?? false;
    if (isExchangeEnabled) {
      providers.push(MexWarmerService);
    }

    return {
      module: MexModule,
      imports: [
        GraphQlModule,
      ],
      providers,
      exports: [
        MexEconomicsService,
        MexPairService,
        MexSettingsService,
        MexTokenService,
        MexFarmService,
        MexTokenChartsService,
      ],
    };
  }
}
