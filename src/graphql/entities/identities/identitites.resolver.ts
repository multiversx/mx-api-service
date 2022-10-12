import { Resolver } from "@nestjs/graphql";
import { Identity } from "src/endpoints/identities/entities/identity";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { IdentityQuery } from "./identities.query";

@Resolver(() => Identity)
export class IdentityResolver extends IdentityQuery {
  constructor(identitiesService: IdentitiesService) {
    super(identitiesService);
  }
}
