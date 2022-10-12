import { Args, Resolver, Query } from "@nestjs/graphql";
import { MexFarm } from "src/endpoints/mex/entities/mex.farm";
import { MexFarmService } from "src/endpoints/mex/mex.farm.service";
import { GetMexFarmsInput } from "./mex.farms.input";

@Resolver()
export class MexFarmsQuery {
  constructor(protected readonly mexFarmsService: MexFarmService) { }

  @Query(() => [MexFarm], { name: "mexFarms", description: "Retrieve a list of farms listed on Maiar Exchange." })
  public async getMexFarms(@Args("input", { description: "Input to retrieve the given farms for." }) input: GetMexFarmsInput): Promise<MexFarm[]> {
    return await this.mexFarmsService.getMexFarms(GetMexFarmsInput.resolve(input));
  }
}
