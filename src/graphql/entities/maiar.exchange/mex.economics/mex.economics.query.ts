import { Resolver, Query } from "@nestjs/graphql";
import { MexEconomics } from "src/endpoints/mex/entities/mex.economics";
import { MexEconomicsService } from "src/endpoints/mex/mex.economics.service";

@Resolver()
export class MexEconomicsQuery {
  constructor(protected readonly mexEconomicsService: MexEconomicsService) { }

  @Query(() => MexEconomics, { name: "mexEconomics", description: "Retrieve economics details of Maiar Exchange." })
  public async getMexEconomics(): Promise<MexEconomics> {
    return await this.mexEconomicsService.getMexEconomics();
  }
}
