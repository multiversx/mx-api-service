import { Module } from "@nestjs/common";

import { AccountModule as InternalAccountModule } from "src/endpoints/accounts/account.module";
import { AccountResolver } from "src/graphql/entities/account/account.resolver";

@Module({
  imports: [InternalAccountModule],
  providers: [AccountResolver],
})
export class AccountModule {}
