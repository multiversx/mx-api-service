import { Args, Resolver, Query } from "@nestjs/graphql";
import { AccountUsername } from "src/endpoints/usernames/entities/account.username";
import { GetUsernameInput } from "./username.input";
import { UsernameService } from "src/endpoints/usernames/username.service";
import { AccountService } from "src/endpoints/accounts/account.service";
import { NotFoundException } from "@nestjs/common";

@Resolver()
export class UsernameQuery {
  constructor(
    protected readonly usernameAccount: UsernameService,
    protected readonly accountService: AccountService,
  ) { }

  @Query(() => AccountUsername, { name: "username", description: "Retrieve account detailed for a given username" })
  public async getAccountDetailed(@Args("input", { description: "Input to retrieve the given detailed account for." }) input: GetUsernameInput): Promise<any> {
    const address = await this.usernameAccount.getAddressForUsername(GetUsernameInput.resolve(input));

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return this.accountService.getAccountSimple(address);
  }
}
