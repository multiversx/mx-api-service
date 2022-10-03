import { Resolver } from "@nestjs/graphql";
import { MexEconomics } from "src/endpoints/mex/entities/mex.economics";
import { MexEconomicsService } from "src/endpoints/mex/mex.economics.service";
import { MexEconomicsQuery } from "./mex.economics.query";

@Resolver(() => MexEconomics)
export class MexEconomicsResolver extends MexEconomicsQuery {
  constructor(mexEconomicsService: MexEconomicsService) {
    super(mexEconomicsService);
  }
}
