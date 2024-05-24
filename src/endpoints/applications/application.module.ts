import { Module } from "@nestjs/common";
import { ElasticIndexerModule } from "src/common/indexer/elastic/elastic.indexer.module";
import { ApplicationService } from "./application.service";

@Module({
  imports: [
    ElasticIndexerModule,
  ],
  providers: [
    ApplicationService,
  ],
  exports: [
    ApplicationService,
  ],
})
export class ApplicationModule { }
