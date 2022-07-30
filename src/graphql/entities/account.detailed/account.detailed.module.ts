import { Module } from "@nestjs/common";

import { AccountDetailedResolver } from "src/graphql/entities/account.detailed/account.detailed.resolver";
import { AccountModule } from "src/endpoints/accounts/account.module";

@Module({
  imports: [AccountModule],
  providers: [AccountDetailedResolver],
})
export class AccountDetailedModule {}
