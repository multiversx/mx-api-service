import { forwardRef, Module } from "@nestjs/common";

import { AccountModule as InternalAccountModule } from "src/endpoints/accounts/account.module";
import { AccountQueryResolver } from "src/graphql/account/account.resolver.query";

@Module({
  imports: [
    forwardRef(() => InternalAccountModule),
  ],
  providers: [AccountQueryResolver],
})
export class AccountModule {}
