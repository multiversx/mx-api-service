import { Args, Resolver, Query } from "@nestjs/graphql";
import { AccountUsername } from "src/endpoints/usernames/entities/account.username";
import { GetUsernameInput } from "./username.input";
import { UsernameService } from "src/endpoints/usernames/username.service";
import { AccountService } from "src/endpoints/accounts/account.service";
import { HttpException, HttpStatus } from "@nestjs/common";

@Resolver()
export class UsernameQuery {
  constructor(
    protected readonly usernameAccount: UsernameService,
    protected readonly accountService: AccountService,
  ) { }

  @Query(() => AccountUsername, { name: "username", description: "Retrive account detailed for a given herotag" })
  public async getAccountDetailed(@Args("input", { description: "Input to retrieve the given detailed account for." }) input: GetUsernameInput): Promise<any> {
    const address = await this.usernameAccount.getUsernameAddressRaw(GetUsernameInput.resolve(input));

    if (!address) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    return this.accountService.getAccountSimple(address);
  }
}
