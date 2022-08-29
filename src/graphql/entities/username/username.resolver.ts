import { Resolver } from "@nestjs/graphql";
import { UsernameQuery } from "./username.query";
import { AccountUsername } from "src/endpoints/usernames/entities/account.username";
import { UsernameService } from "src/endpoints/usernames/username.service";
import { AccountService } from "src/endpoints/accounts/account.service";

@Resolver(() => AccountUsername)
export class UsernameResolver extends UsernameQuery {
  constructor(
    usernameAccount: UsernameService,
    accountService: AccountService) {
    super(usernameAccount, accountService);
  }
}
