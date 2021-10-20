import { Module } from "@nestjs/common";
import { ApiConfigModule } from "../api.config.module";
import { ApiModule } from "./api.module";
import { DataApiService } from "./data.api.service";


@Module({
  imports: [
    ApiConfigModule,
    ApiModule,
  ],
  providers: [
    DataApiService
  ],
  exports: [
    DataApiService
  ]
})
export class DataApiModule { }