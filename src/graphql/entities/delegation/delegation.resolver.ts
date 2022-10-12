import { Resolver } from "@nestjs/graphql";
import { Delegation } from "src/endpoints/delegation/entities/delegation";
import { DelegationQuery } from "./delegation.query";
import { DelegationService } from "src/endpoints/delegation/delegation.service";

@Resolver(() => Delegation)
export class DelegationResolver extends DelegationQuery {
  constructor(delegationService: DelegationService) {
    super(delegationService);
  }
}
