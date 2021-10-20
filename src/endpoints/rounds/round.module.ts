import { Module } from "@nestjs/common";
import { BlsModule } from "src/common/bls.module";
import { ElasticModule } from "src/common/external-calls-services/elastic.module";
import { RoundService } from "./round.service";

@Module({
  imports: [
    ElasticModule,
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