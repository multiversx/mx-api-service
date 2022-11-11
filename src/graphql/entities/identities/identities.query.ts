import { Args, Query, Resolver } from "@nestjs/graphql";
import { Identity } from "src/endpoints/identities/entities/identity";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { GetIndentityInput } from "./identities.input";

@Resolver()
export class IdentityQuery {
  constructor(protected readonly identitiesService: IdentitiesService) { }

  @Query(() => [Identity], { name: "identity", description: `Retrieve list of all node identities, used to group nodes by the same entity. "Free-floating" nodes that do not belong to any identity will also be returned` })
  public async getIdentity(@Args("input", { description: "." }) input: GetIndentityInput): Promise<Identity[]> {
    return await this.identitiesService.getIdentities(GetIndentityInput.resolve(input));
  }

  @Query(() => [Identity], { name: "identities", description: `Retrieve list of all node identities, used to group nodes by the same entity. "Free-floating" nodes that do not belong to any identity will also be returned`, nullable: true })
  public async getIdentities(): Promise<Identity[]> {
    return await this.identitiesService.getAllIdentities();
  }
}
