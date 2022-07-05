import { DynamicModule, Global, Module, Type } from "@nestjs/common";
import configuration from "config/configuration";
import { ApiMetricsModule } from "../metrics/api.metrics.module";
import { ElasticIndexerModule } from "./elastic/elastic.indexer.module";
import { ElasticIndexerService } from "./elastic/elastic.indexer.service";
import { IndexerInterface } from "./indexer.interface";
import { IndexerService } from "./indexer.service";
import { PostgresIndexerModule } from "./postgres/postgres.indexer.module";
import { PostgresIndexerService } from "./postgres/postgres.indexer.service";

@Global()
@Module({})
export class IndexerModule {
  static register(): DynamicModule {
    let indexerModule: Type<any> = ElasticIndexerModule;
    let indexerInterface: Type<IndexerInterface> = ElasticIndexerService;

    const isPostgres = configuration().indexer?.type === 'postgres';
    if (isPostgres) {
      indexerModule = PostgresIndexerModule;
      indexerInterface = PostgresIndexerService;
    }

    return {
      module: IndexerModule,
      imports: [
        indexerModule,
        ApiMetricsModule,
      ],
      providers: [
        {
          provide: 'IndexerInterface',
          useClass: indexerInterface,
        },
        IndexerService,
      ],
      exports: ['IndexerInterface', IndexerService],
    };
  }
}
