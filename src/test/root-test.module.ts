import { ApiModuleOptions, ApiService, CachingModuleOptions, CachingService, ElasticModuleOptions, ElasticService, LocalCacheService, MetricsService } from "@multiversx/sdk-nestjs";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { ElasticIndexerHelper } from "src/common/indexer/elastic/elastic.indexer.helper";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { IndexerModule } from "src/common/indexer/indexer.module";
import { IndexerService } from "src/common/indexer/indexer.service";
import { BlsService } from "src/endpoints/bls/bls.service";
@Module({
  imports: [IndexerModule],
  providers: [
    {
      provide: 'IndexerInterface',
      useClass: ElasticIndexerService,
    },
    GraphQlService,
    ApiConfigService,
    ConfigService,
    CachingService,
    ElasticService,
    ElasticIndexerHelper,
    ApiService,
    CachingModuleOptions,
    LocalCacheService,
    MetricsService,
    ElasticModuleOptions,
    BlsService,
    ApiModuleOptions,
    IndexerService,
    EventEmitter2,
  ],
  exports: [GraphQlService, IndexerService, CachingService],
})
export class RootTestModule { }
