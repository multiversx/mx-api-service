import { DynamicModule, Global, Module } from "@nestjs/common";
import { ElasticIndexerModule } from "./elastic/elastic.indexer.module";
import { ElasticIndexerService } from "./elastic/elastic.indexer.service";
import { IndexerService } from "./indexer.service";

@Global()
@Module({})
export class IndexerModule {
  static register(): DynamicModule {
    return {
      module: IndexerModule,
      imports: [
        ElasticIndexerModule,
      ],
      providers: [
        {
          provide: 'IndexerInterface',
          useClass: ElasticIndexerService,
        },
        IndexerService,
      ],
      exports: ['IndexerInterface', IndexerService],
    };
  }
}
