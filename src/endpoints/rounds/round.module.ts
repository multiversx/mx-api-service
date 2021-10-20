import { Module } from "@nestjs/common";
import { BlsModule } from "src/common/bls.module";
import { CachingModule } from "src/common/caching/caching.module";
import { ElasticModule } from "src/common/external/elastic.module";
import { RoundService } from "./round.service";

@Module({
  imports: [
    ElasticModule,
    CachingModule,
    BlsModule
  ],
  providers: [
    RoundService,
  ],
  exports: [
    RoundService,
  ]
})
export class RoundModule { }