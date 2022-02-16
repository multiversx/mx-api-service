import { Module } from "@nestjs/common";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { CachingModule } from "src/common/caching/caching.module";
import { ElasticModule } from "src/common/elastic/elastic.module";
import { BlsModule } from "../bls/bls.module";
import { RoundService } from "./round.service";

@Module({
  imports: [
    ElasticModule,
    CachingModule,
    BlsModule,
    ApiConfigModule,
  ],
  providers: [
    RoundService,
  ],
  exports: [
    RoundService,
  ],
})
export class RoundModule { }
