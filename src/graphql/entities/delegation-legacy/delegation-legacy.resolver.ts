import { Resolver } from "@nestjs/graphql";
import { DelegationLegacyQuery } from "./delegation-legacy.query";
import { DelegationLegacy } from "src/endpoints/delegation.legacy/entities/delegation.legacy";
import { DelegationLegacyService } from "src/endpoints/delegation.legacy/delegation.legacy.service";

@Resolver(() => DelegationLegacy)
export class DelegationLegacyResolver extends DelegationLegacyQuery {
  constructor(delegationLegacyService: DelegationLegacyService) {
    super(delegationLegacyService);
  }
}
