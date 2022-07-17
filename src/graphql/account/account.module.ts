import { Module } from "@nestjs/common";

import { AccountModule as InternalAccountModule } from "src/endpoints/accounts/account.module";
import { AccounteDetailedResolver } from "./resolver/account.detailed.resolver";
import { AccountResolver } from "src/graphql/account/resolver/account.resolver";

@Module({
  imports: [InternalAccountModule],
  providers: [AccounteDetailedResolver, AccountResolver],
})
export class AccountModule {}
