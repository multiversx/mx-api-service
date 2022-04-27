import { Module } from "@nestjs/common";
import { GraphQlModule } from "src/common/graphql/graphql.module";
import { MexEconomicsService } from "./mex.economics.service";
import { MexPairsService } from "./mex.pairs.service";
import { MexSettingsService } from "./mex.settings.service";

@Module({
  imports: [
    GraphQlModule,
  ],
  providers: [
    MexEconomicsService,
    MexSettingsService,
    MexPairsService,
  ],
  exports: [
    MexEconomicsService,
    MexPairsService,
    MexSettingsService,
  ],
})
export class MexAnalyticsModule { }
