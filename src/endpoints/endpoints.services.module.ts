import { forwardRef, Module } from "@nestjs/common";
import { AccountModule } from "./accounts/account.module";
import { BlockModule } from "./blocks/block.module";
import { BlsModule } from "./bls/bls.module";
import { CollectionModule } from "./collections/collection.module";
import { DelegationLegacyModule } from "./delegation.legacy/delegation.legacy.module";
import { DelegationModule } from "./delegation/delegation.module";
import { EsdtModule } from "./esdt/esdt.module";
import { IdentitiesModule } from "./identities/identities.module";
import { KeysModule } from "./keys/keys.module";
import { MexModule } from "./mex/mex.module";
import { MiniBlockModule } from "./miniblocks/miniblock.module";
import { NetworkModule } from "./network/network.module";
import { NftModule } from "./nfts/nft.module";
import { TagModule } from "./nfttags/tag.module";
import { NodeModule } from "./nodes/node.module";
import { ProviderModule } from "./providers/provider.module";
import { RoundModule } from "./rounds/round.module";
import { SmartContractResultModule } from "./sc-results/scresult.module";
import { ShardModule } from "./shards/shard.module";
import { StakeModule } from "./stake/stake.module";
import { TokenModule } from "./tokens/token.module";
import { TransactionModule } from "./transactions/transaction.module";
import { UsernameModule } from "./usernames/username.module";
import { VmQueryModule } from "./vm.query/vm.query.module";
import { WaitingListModule } from "./waiting-list/waiting.list.module";

@Module({
  imports: [
    forwardRef(() => AccountModule),
    forwardRef(() => BlockModule),
    forwardRef(() => CollectionModule),
    forwardRef(() => DelegationModule),
    forwardRef(() => DelegationLegacyModule),
    forwardRef(() => IdentitiesModule),
    forwardRef(() => KeysModule),
    forwardRef(() => MexModule),
    forwardRef(() => MiniBlockModule),
    forwardRef(() => NetworkModule),
    forwardRef(() => NftModule),
    forwardRef(() => TagModule),
    forwardRef(() => NodeModule),
    forwardRef(() => ProviderModule),
    forwardRef(() => RoundModule),
    forwardRef(() => SmartContractResultModule),
    forwardRef(() => ShardModule),
    forwardRef(() => StakeModule),
    forwardRef(() => TokenModule),
    forwardRef(() => RoundModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => UsernameModule),
    forwardRef(() => VmQueryModule),
    forwardRef(() => WaitingListModule),
    forwardRef(() => EsdtModule),
    forwardRef(() => BlsModule),
  ],
  exports: [
    AccountModule, CollectionModule, BlockModule, DelegationModule, DelegationLegacyModule, IdentitiesModule, KeysModule,
    MexModule, MiniBlockModule, NetworkModule, NftModule, TagModule, NodeModule, ProviderModule,
    RoundModule, SmartContractResultModule, ShardModule, StakeModule, TokenModule, RoundModule, TransactionModule, UsernameModule, VmQueryModule,
    WaitingListModule, EsdtModule, BlsModule,
  ],
})
export class EndpointsServicesModule { }