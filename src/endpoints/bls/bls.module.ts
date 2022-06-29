import { Global, Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { BlsService } from "./bls.service";

@Global()
@Module({
  imports: [
    DynamicModuleUtils.getElasticModule(),
  ],
  providers: [
    BlsService,
  ],
  exports: [
    BlsService,
  ],
})
export class BlsModule { }
