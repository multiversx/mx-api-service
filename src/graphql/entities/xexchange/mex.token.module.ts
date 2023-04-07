import { Module } from "@nestjs/common";
import { MexModule } from "src/endpoints/mex/mex.module";
import { MexEconomicsResolver } from "./mex.economics/mex.economics.resolver";
import { MexFarmResolver } from "./mex.farms/mex.farms.resolver";
import { MexTokenPairsResolver } from "./mex.pairs/mex.pairs.resolver";
import { MexTokenResolver } from "./mex.token/mex.token.resolver";
@Module({
  imports: [MexModule.forRoot()],
  providers: [
    MexTokenResolver,
    MexEconomicsResolver,
    MexTokenPairsResolver,
    MexFarmResolver,
  ],
})
export class MexTokenModule { }
