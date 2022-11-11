import { Resolver } from "@nestjs/graphql";
import { GlobalStake } from "src/endpoints/stake/entities/global.stake";
import { StakeService } from "src/endpoints/stake/stake.service";
import { StakeQuery } from "./stake.query";

@Resolver(() => GlobalStake)
export class StakeResolver extends StakeQuery {
  constructor(stakeService: StakeService) {
    super(stakeService);
  }
}
