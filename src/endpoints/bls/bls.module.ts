import { Global, Module } from "@nestjs/common";
import { ElasticModule } from "src/common/elastic/elastic.module";
import { BlsService } from "./bls.service";

@Global()
@Module({
  imports: [
    ElasticModule,
  ],
  providers: [
    BlsService,
  ],
  exports: [
    BlsService,
  ],
})
export class BlsModule { }
