import { Global, Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { ApiConfigModule } from "../api-config/api.config.module";
import { DataApiService } from "./data.api.service";

@Global()
@Module({
  imports: [
    ApiConfigModule,
    DynamicModuleUtils.getApiModule(),
  ],
  providers: [
    DataApiService,
  ],
  exports: [
    DataApiService,
  ],
})
export class DataApiModule { }
