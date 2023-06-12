import { forwardRef, Module } from "@nestjs/common";
import { AssetsModule } from "src/common/assets/assets.module";
import { PluginModule } from "src/plugins/plugin.module";
import { CollectionModule } from "../collections/collection.module";
import { DelegationLegacyModule } from "../delegation.legacy/delegation.legacy.module";
import { NftModule } from "../nfts/nft.module";
import { SmartContractResultModule } from "../sc-results/scresult.module";
import { StakeModule } from "../stake/stake.module";
import { TokenModule } from "../tokens/token.module";
import { TransactionModule } from "../transactions/transaction.module";
import { TransferModule } from "../transfers/transfer.module";
import { UsernameModule } from "../usernames/username.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { WaitingListModule } from "../waiting-list/waiting.list.module";
import { AccountService } from "./account.service";
import { ProviderModule } from "../providers/provider.module";
import { KeysModule } from "../keys/keys.module";

@Module({
  imports: [
    VmQueryModule,
    forwardRef(() => NftModule),
    DelegationLegacyModule,
    WaitingListModule,
    forwardRef(() => StakeModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => SmartContractResultModule),
    forwardRef(() => CollectionModule),
    forwardRef(() => PluginModule),
    forwardRef(() => TransferModule),
    forwardRef(() => TokenModule),
    forwardRef(() => AssetsModule),
    forwardRef(() => ProviderModule),
    UsernameModule,
    forwardRef(() => KeysModule),
  ],
  providers: [
    AccountService,
  ],
  exports: [
    AccountService,
  ],
})
export class AccountModule { }
