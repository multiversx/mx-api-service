import { Global, Module } from "@nestjs/common";
import { ApiConfigModule } from "../api-config/api.config.module";
import { ElasticService } from "./elastic.service";

@Global()
@Module({
  imports: [
    ApiConfigModule,
  ],
  providers: [
    ElasticService,
  ],
  exports: [
    ElasticService,
  ],
})
export class ElasticModule { }
