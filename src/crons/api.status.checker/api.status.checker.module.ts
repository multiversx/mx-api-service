import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ApiStatusCheckerService } from "src/common/api-status-checker/api.status.checker.service";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { EndpointsServicesModule } from "src/endpoints/endpoints.services.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { CronsApiStatusCheckerService } from "./api.status.checker.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EndpointsServicesModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    CronsApiStatusCheckerService, ElasticIndexerService, ApiStatusCheckerService,
  ],
})
export class CronsApiStatusCheckerModule { }
