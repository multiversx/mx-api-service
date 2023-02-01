import { Module } from "@nestjs/common";

import { AccountDetailedResolver } from "src/graphql/entities/account.detailed/account.detailed.resolver";
import { AccountModule } from "src/endpoints/accounts/account.module";
import { CollectionModule } from "src/endpoints/collections/collection.module";
import { NftModule } from "src/endpoints/nfts/nft.module";
import { TokenModule } from "src/endpoints/tokens/token.module";
import { DelegationModule } from "src/endpoints/delegation/delegation.module";
import { StakeModule } from "src/endpoints/stake/stake.module";
import { DelegationLegacyModule } from "src/endpoints/delegation.legacy/delegation.legacy.module";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";
import { TransferModule } from "src/endpoints/transfers/transfer.module";
import { SmartContractResultModule } from "src/endpoints/sc-results/scresult.module";

@Module({
  imports: [
    AccountModule,
    CollectionModule,
    NftModule,
    TokenModule,
    DelegationModule,
    StakeModule,
    DelegationLegacyModule,
    TransactionModule,
    TransferModule,
    SmartContractResultModule,
  ],
  providers: [AccountDetailedResolver],
})
export class AccountDetailedModule { }
