import { Module } from "@nestjs/common";
import { ElasticIndexerModule } from "src/common/indexer/elastic/elastic.indexer.module";
import { ApplicationService } from "./application.service";
import { AssetsService } from '../../common/assets/assets.service';

@Module({
  imports: [
    ElasticIndexerModule,
  ],
  providers: [
    ApplicationService,
    AssetsService,
  ],
  exports: [
    ApplicationService,
  ],
})
export class ApplicationModule { }
