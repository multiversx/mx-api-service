import { Module } from "@nestjs/common";
import { UsernameResolver } from "./username.resolver";
import { UsernameModule as InternalUsernameModule } from "src/endpoints/usernames/username.module";
import { AccountModule } from "src/endpoints/accounts/account.module";

@Module({
  imports: [InternalUsernameModule, AccountModule],
  providers: [UsernameResolver],
})
export class UsernameModule { }
