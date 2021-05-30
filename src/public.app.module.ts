import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { AccountController } from './endpoints/accounts/account.controller';
import { AccountService } from './endpoints/accounts/account.service';
import { ApiConfigService } from './helpers/api.config.service';
import { ElasticService } from './helpers/elastic.service';
import { GatewayService } from './helpers/gateway.service';
import { NetworkController } from './endpoints/network/network.controller';
import { NetworkService } from './endpoints/network/network.service';
import { TransactionController } from './endpoints/transactions/transaction.controller';
import { TransactionService } from './endpoints/transactions/transaction.service';
import { TokenController } from './endpoints/tokens/token.controller';
import { TokenService } from './endpoints/tokens/token.service';
import { BlockService } from './endpoints/blocks/block.service';
import { BlockController } from './endpoints/blocks/block.controller';
import { MiniBlockService } from './endpoints/miniblocks/mini.block.service';
import { MiniBlockController } from './endpoints/miniblocks/mini.block.controller';
import { RoundService } from './endpoints/rounds/round.service';
import { RoundController } from './endpoints/rounds/round.controller';
import { NodeController } from './endpoints/nodes/node.controller';
import { NodeService } from './endpoints/nodes/node.service';
import { VmQueryService } from './endpoints/vm.query/vm.query.service';
import { CachingService } from './helpers/caching.service';
import { KeybaseService } from './helpers/keybase.service';
import { ProviderService } from './endpoints/providers/provider.service';
import { ProviderController } from './endpoints/providers/provider.controller';
import { StakeService } from './endpoints/stake/stake.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ApiService } from './helpers/api.service';
import { ProfilerService } from './helpers/profiler.service';
import { AccessController } from './endpoints/access/access.controller';
import { AccessService } from './endpoints/access/access.service';
import { DelegationLegacyService } from './endpoints/delegation.legacy/delegation.legacy.service';
import { DelegationLegacyController } from './endpoints/delegation.legacy/delegation.legacy.controller';
import { StakeController } from './endpoints/stake/stake.controller';
import { DelegationController } from './endpoints/delegation/delegation.controller';
import { DelegationService } from './endpoints/delegation/delegation.service';
import { VmQueryController } from './endpoints/vm.query/vm.query.controller';
import { CacheConfigService } from './helpers/cache.config.service';
import { CachingInterceptor } from './interceptors/caching.interceptor';
import { ShardController } from './endpoints/shards/shard.controller';
import { ShardService } from './endpoints/shards/shard.service';
import { MetricsService } from './endpoints/metrics/metrics.service';
import { IdentitiesController } from './endpoints/identities/identities.controller';
import { IdentitiesService } from './endpoints/identities/identities.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration]
    }),
    CacheModule.register()
  ],
  controllers: [
    NetworkController, AccountController, TransactionController, TokenController, BlockController, 
    MiniBlockController, RoundController, NodeController, ProviderController,
    AccessController, DelegationLegacyController, StakeController, DelegationController,
    VmQueryController, ShardController, IdentitiesController
  ],
  providers: [
    NetworkService, ApiConfigService, AccountService, ElasticService, GatewayService, TransactionService, 
    TokenService, BlockService, MiniBlockService, RoundService, NodeService, VmQueryService,
    CachingService, KeybaseService, ProviderService,
    StakeService, LoggingInterceptor, ApiService, ProfilerService, AccessService, DelegationLegacyService,
    DelegationService, CacheConfigService, CachingInterceptor, ShardService, MetricsService, IdentitiesService
  ],
  exports: [
    ApiConfigService, RoundService, CachingService, TransactionService, GatewayService, MetricsService, NodeService,
    TokenService, ShardService
  ]
})
export class PublicAppModule {}
