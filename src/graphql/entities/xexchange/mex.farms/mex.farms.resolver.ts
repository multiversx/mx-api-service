import { Resolver } from "@nestjs/graphql";
import { MexFarm } from "src/endpoints/mex/entities/mex.farm";
import { MexFarmService } from "src/endpoints/mex/mex.farm.service";
import { MexFarmsQuery } from "./mex.farms.query";

@Resolver(() => MexFarm)
export class MexFarmResolver extends MexFarmsQuery {
  constructor(mexFarmsService: MexFarmService) {
    super(mexFarmsService);
  }
}
