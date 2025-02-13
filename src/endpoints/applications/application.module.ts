import { Module } from "@nestjs/common";
import { ElasticIndexerModule } from "src/common/indexer/elastic/elastic.indexer.module";
import { ApplicationService } from "./application.service";
import { AssetsService } from '../../common/assets/assets.service';
import { GatewayService } from "src/common/gateway/gateway.service";
import { TransferModule } from "../transfers/transfer.module";

@Module({
  imports: [
    ElasticIndexerModule,
    TransferModule,
  ],
  providers: [
    ApplicationService,
    AssetsService,
    GatewayService,
  ],
  exports: [
    ApplicationService,
  ],
})
export class ApplicationModule { }
