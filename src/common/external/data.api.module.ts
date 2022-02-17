import { Global, Module } from "@nestjs/common";
import { DataApiService } from "./data.api.service";

@Global()
@Module({
  providers: [
    DataApiService,
  ],
  exports: [
    DataApiService,
  ],
})
export class DataApiModule { }
