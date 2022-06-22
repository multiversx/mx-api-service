import { Module } from "@nestjs/common";
import { ElasticIndexerService } from "./elastic.indexer.service";

@Module({
  providers: [ElasticIndexerService],
  exports: [ElasticIndexerService],
})
export class ElasticIndexerModule { }
