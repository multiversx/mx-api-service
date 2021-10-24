import { Module } from "@nestjs/common";
import { CachingModule } from "src/common/caching/caching.module";
import { ElasticModule } from "src/common/elastic/elastic.module";
import { BlsModule } from "../bls/bls.module";
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