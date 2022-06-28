import { CachingModule, ElasticModule } from "@elrondnetwork/nestjs-microservice-common";
import { forwardRef, Global, Module } from "@nestjs/common";
import { GatewayModule } from "../gateway/gateway.module";
import { ProtocolService } from "./protocol.service";

@Global()
@Module({
  imports: [
    GatewayModule,
    forwardRef(() => CachingModule),
    ElasticModule,
  ],
  providers: [
    ProtocolService,
  ],
  exports: [
    ProtocolService,
  ],
})
export class ProtocolModule { }
