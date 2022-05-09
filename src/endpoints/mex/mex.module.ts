import { Module } from "@nestjs/common";
import { GraphQlModule } from "src/common/graphql/graphql.module";
import { MexEconomicsService } from "./mex.economics.service";
import { MexFarmService } from "./mex.farm.service";
import { MexPairsService } from "./mex.pairs.service";
import { MexSettingsService } from "./mex.settings.service";
import { MexTokenService } from "./mex.token.service";

@Module({
  imports: [
    GraphQlModule,
  ],
  providers: [
    MexEconomicsService,
    MexSettingsService,
    MexPairsService,
    MexTokenService,
    MexFarmService,
  ],
  exports: [
    MexEconomicsService,
    MexPairsService,
    MexSettingsService,
    MexTokenService,
    MexFarmService,
  ],
})
export class MexModule { }
