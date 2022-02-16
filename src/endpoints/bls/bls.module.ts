import { Module } from "@nestjs/common";
import { ApiConfigModule } from "../../common/api-config/api.config.module";
import { BlsService } from "./bls.service";
import { ElasticModule } from "../../common/elastic/elastic.module";
import { ExternalModule } from "../../common/external/external.module";


@Module({
  imports: [
    ApiConfigModule, ExternalModule, ElasticModule,
  ],
  providers: [
    BlsService,
  ],
  exports: [
    BlsService,
  ],
})
export class BlsModule { }
