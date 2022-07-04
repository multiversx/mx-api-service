import { Global, Module } from "@nestjs/common";
import { ElasticIndexerModule } from "src/common/indexer/elastic/elastic.indexer.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { BlsService } from "./bls.service";

@Global()
@Module({
  imports: [
    DynamicModuleUtils.getElasticModule(),
    ElasticIndexerModule, // TODO
  ],
  providers: [
    BlsService,
  ],
  exports: [
    BlsService,
  ],
})
export class BlsModule { }
