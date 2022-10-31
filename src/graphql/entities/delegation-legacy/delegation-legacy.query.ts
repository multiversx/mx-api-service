import { Query, Resolver } from "@nestjs/graphql";
import { DelegationLegacyService } from "src/endpoints/delegation.legacy/delegation.legacy.service";
import { DelegationLegacy } from "src/endpoints/delegation.legacy/entities/delegation.legacy";

@Resolver()
export class DelegationLegacyQuery {
  constructor(protected readonly delegationLegacyService: DelegationLegacyService) { }

  @Query(() => DelegationLegacy, { name: "delegationLegacy", description: "Retrieve legacy delegation contract global information." })
  public async getDelegation(): Promise<DelegationLegacy> {
    return await this.delegationLegacyService.getDelegation();
  }
}
