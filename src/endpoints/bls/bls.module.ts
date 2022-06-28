import { ElasticModule } from "@elrondnetwork/nestjs-microservice-common";
import { Global, Module } from "@nestjs/common";
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
