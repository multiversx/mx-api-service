import { Module } from "@nestjs/common";

import { AccountDetailedResolver } from "src/graphql/entities/account.detailed/account.detailed.resolver";
import { AccountModule } from "src/endpoints/accounts/account.module";
import { CollectionModule } from "src/endpoints/collections/collection.module";
import { NftModule } from "src/endpoints/nfts/nft.module";
import { TokenModule } from "src/endpoints/tokens/token.module";

@Module({
  imports: [AccountModule, CollectionModule, NftModule, TokenModule],
  providers: [AccountDetailedResolver],
})
export class AccountDetailedModule { }
