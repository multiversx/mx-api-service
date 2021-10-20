import { Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { AccountController } from "./accounts/account.controller";
import { BlockController } from "./blocks/block.controller";
import { DelegationLegacyController } from "./delegation.legacy/delegation.legacy.controller";
import { DelegationController } from "./delegation/delegation.controller";
import { EndpointsServicesModule } from "./enpoints.services.module";
import { IdentitiesController } from "./identities/identities.controller";
import { KeysController } from "./keys/keys.controller";
import { MiniBlockController } from "./miniblocks/mini.block.controller";
import { NetworkController } from "./network/network.controller";
import { NftController } from "./nfts/nft.controller";
import { TagController } from "./nfttags/tag.controller";
import { NodeController } from "./nodes/node.controller";
import { ProviderController } from "./providers/provider.controller";
import { ProxyController } from "./proxy/proxy.controller";
import { ProxyModule } from "./proxy/proxy.module";
import { RoundController } from "./rounds/round.controller";
import { ShardController } from "./shards/shard.controller";
import { StakeController } from "./stake/stake.controller";
import { TokenController } from "./tokens/token.controller";
import { TransactionController } from "./transactions/transaction.controller";
import { UsernameController } from "./usernames/username.controller";
import { VmQueryController } from "./vm.query/vm.query.controller";
import { WaitingListController } from "./waiting-list/waiting.list.controller";


@Module({
  imports: [
    CommonModule,
    EndpointsServicesModule,
    ProxyModule, 
  ],
  controllers: [
    AccountController, BlockController, DelegationController, DelegationLegacyController, IdentitiesController,
    KeysController, MiniBlockController, NetworkController, NftController, TagController, NodeController,
    ProviderController, ProxyController, RoundController, ShardController, StakeController, StakeController,
    TokenController, TransactionController, UsernameController, VmQueryController, WaitingListController,
  ],
})
export class EndpointsControllersModule { }