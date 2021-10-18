import { forwardRef, Module } from "@nestjs/common";
import { AccountModule } from "./accounts/account.module";
import { BlockModule } from "./blocks/block.module";
import { DelegationLegacyModule } from "./delegation.legacy/delegation.legacy.module";
import { DelegationModule } from "./delegation/delegation.module";
import { IdentitiesModule } from "./identities/identities.module";
import { KeysModule } from "./keys/keys.module";
import { MetricsModule } from "./metrics/metrics.module";
import { MiniBlockModule } from "./miniblocks/miniblock.module";
import { NetworkModule } from "./network/network.module";
import { NftModule } from "./nfts/nft.module";
import { TagModule } from "./nfttags/tag.module";
import { NodeModule } from "./nodes/node.module";
import { ProviderModule } from "./providers/provider.module";
import { ProxyModule } from "./proxy/proxy.module"
import { RoundModule } from "./rounds/round.module";
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
    forwardRef(() => DelegationModule), 
    forwardRef(() => DelegationLegacyModule), 
    forwardRef(() => IdentitiesModule), 
    forwardRef(() => KeysModule),
    forwardRef(() => MetricsModule),
    forwardRef(() => MiniBlockModule),
    forwardRef(() => NetworkModule),
    forwardRef(() => NftModule),
    forwardRef(() => TagModule),
    forwardRef(() => NodeModule),
    forwardRef(() => ProviderModule),
    forwardRef(() => ProxyModule),
    forwardRef(() => RoundModule),
    forwardRef(() => ShardModule),
    forwardRef(() => StakeModule),
    forwardRef(() => TokenModule),
    forwardRef(() => RoundModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => UsernameModule),
    forwardRef(() => VmQueryModule),
    forwardRef(() => WaitingListModule),
  ],
  exports: [
    AccountModule, BlockModule, DelegationModule, DelegationLegacyModule, IdentitiesModule, KeysModule,
    MetricsModule, MiniBlockModule, NetworkModule, NftModule, TagModule, NodeModule, ProviderModule, ProxyModule,
    RoundModule, ShardModule, StakeModule, TokenModule, RoundModule, TransactionModule, UsernameModule, VmQueryModule,
    WaitingListModule,
  ]
})
export class EndpointsModule { }