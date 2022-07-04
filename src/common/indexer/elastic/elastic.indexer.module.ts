import { Global, Module } from "@nestjs/common";
import { ElasticIndexerService } from "./elastic.indexer.service";

@Global()
@Module({
  providers: [ElasticIndexerService],
  exports: [ElasticIndexerService],
})
export class ElasticIndexerModule { }
