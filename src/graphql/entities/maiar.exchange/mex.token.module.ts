import { Module } from "@nestjs/common";
import { MexModule as InternalMexModule } from "src/endpoints/mex/mex.module";
import { MexEconomicsResolver } from "./mex.economics/mex.economics.resolver";
import { MexFarmResolver } from "./mex.farms/mex.farms.resolver";
import { MexTokenPairsResolver } from "./mex.pairs/mex.pairs.resolver";
import { MexTokensResolver } from "./mex.token/mex.token.resolver";
@Module({
  imports: [InternalMexModule],
  providers: [
    MexTokensResolver,
    MexEconomicsResolver,
    MexTokenPairsResolver,
    MexFarmResolver,
  ],
})
export class MexModule { }
