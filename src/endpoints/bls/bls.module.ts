import { Global, Module } from "@nestjs/common";
import { IndexerModule } from "src/common/indexer/indexer.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { BlsService } from "./bls.service";

@Global()
@Module({
  imports: [
    DynamicModuleUtils.getElasticModule(),
    IndexerModule.register(),
  ],
  providers: [
    BlsService,
  ],
  exports: [
    BlsService,
  ],
})
export class BlsModule { }
