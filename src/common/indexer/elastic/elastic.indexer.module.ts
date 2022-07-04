import { Global, Module } from "@nestjs/common";
import { ElasticIndexerHelper } from "./elastic.indexer.helper";
import { ElasticIndexerService } from "./elastic.indexer.service";

@Global()
@Module({
  providers: [ElasticIndexerService, ElasticIndexerHelper],
  exports: [ElasticIndexerService, ElasticIndexerHelper],
})
export class ElasticIndexerModule { }
