import { Module } from "@nestjs/common";
import { GraphQlModule } from "src/common/graphql/graphql.module";
import { MexEconomicsService } from "./mex.economics.service";
import { MexFarmService } from "./mex.farm.service";
import { MexPairService } from "./mex.pair.service";
import { MexSettingsService } from "./mex.settings.service";
import { MexTokenService } from "./mex.token.service";

@Module({
  imports: [
    GraphQlModule,
  ],
  providers: [
    MexEconomicsService,
    MexSettingsService,
    MexPairService,
    MexTokenService,
    MexFarmService,
  ],
  exports: [
    MexEconomicsService,
    MexPairService,
    MexSettingsService,
    MexTokenService,
    MexFarmService,
  ],
})
export class MexModule { }
