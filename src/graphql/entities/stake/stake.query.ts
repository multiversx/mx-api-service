import { Resolver, Query } from "@nestjs/graphql";
import { GlobalStake } from "src/endpoints/stake/entities/global.stake";
import { StakeService } from "src/endpoints/stake/stake.service";

@Resolver()
export class StakeQuery {
  constructor(protected readonly stakeService: StakeService) { }

  @Query(() => GlobalStake, { name: "stake", description: "Retrieve general stake informations." })
  public async getGlobalStake(): Promise<any> {
    return await this.stakeService.getGlobalStake();
  }
}
