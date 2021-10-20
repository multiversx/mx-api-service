import { Module } from "@nestjs/common";
import { ApiConfigModule } from "./api-config/api.config.module";
import { BlsService } from "./bls.service";
import { ElasticModule } from "./elastic/elastic.module";
import { ExternalModule } from "./external/external.module";


@Module({
  imports: [
    ApiConfigModule, ExternalModule, ElasticModule
  ],
  providers: [
    BlsService
  ],
  exports: [
    BlsService
  ]
})
export class BlsModule { }