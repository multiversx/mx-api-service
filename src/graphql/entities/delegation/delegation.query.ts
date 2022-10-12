import { Query, Resolver } from "@nestjs/graphql";
import { DelegationService } from "src/endpoints/delegation/delegation.service";
import { Delegation } from "src/endpoints/delegation/entities/delegation";

@Resolver()
export class DelegationQuery {
  constructor(protected readonly delegationService: DelegationService) { }

  @Query(() => Delegation, { name: "delegation", description: "Retrieve all delegation staking information." })
  public async getDelegation(): Promise<Delegation> {
    return await this.delegationService.getDelegation();
  }
}
