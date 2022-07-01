import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { AssetsService } from "../../common/assets/assets.service";
import { ApiConfigModule } from "../api-config/api.config.module";

@Module({
  imports: [
    DynamicModuleUtils.getCachingModule(),
    ApiConfigModule,
  ],
  providers: [
    AssetsService,
  ],
  exports: [
    AssetsService,
  ],
})
export class AssetsModule { }
