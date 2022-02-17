import { Global, Module } from "@nestjs/common";
import { ElasticService } from "./elastic.service";

@Global()
@Module({
  providers: [
    ElasticService,
  ],
  exports: [
    ElasticService,
  ],
})
export class ElasticModule { }
