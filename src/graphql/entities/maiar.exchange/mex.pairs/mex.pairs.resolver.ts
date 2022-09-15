import { Resolver } from "@nestjs/graphql";
import { MexPair } from "src/endpoints/mex/entities/mex.pair";
import { MexPairService } from "src/endpoints/mex/mex.pair.service";
import { MexTokenPairsQuery } from "./mex.pairs.query";

@Resolver(() => MexPair)
export class MexTokenPairsResolver extends MexTokenPairsQuery {
  constructor(mexTokenPairService: MexPairService) {
    super(mexTokenPairService);
  }
}
