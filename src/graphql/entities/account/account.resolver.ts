import { Resolver } from "@nestjs/graphql";

import { Account } from "src/endpoints/accounts/entities/account";
import { AccountService } from "src/endpoints/accounts/account.service";
import { AccountQuery } from "src/graphql/entities/account/account.query";

@Resolver(() => Account)
export class AccountResolver extends AccountQuery {
  constructor(accountService: AccountService) {
    super(accountService);
  }
}
