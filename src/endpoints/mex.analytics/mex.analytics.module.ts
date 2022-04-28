import { Module } from "@nestjs/common";
import { GraphQlModule } from "src/common/graphql/graphql.module";
import { MexEconomicsService } from "./mex.economics.service";
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
  ],
  exports: [
    MexEconomicsService,
    MexPairsService,
    MexSettingsService,
    MexTokenService,
  ],
})
export class MexAnalyticsModule { }
