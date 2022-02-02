import { forwardRef, Module } from "@nestjs/common";
import { CachingModule } from "../caching/caching.module";
import { ElasticModule } from "../elastic/elastic.module";
import { GatewayModule } from "../gateway/gateway.module";
import { ProtocolService } from "./protocol.service";

@Module({
  imports: [
    forwardRef(() => CachingModule),
    GatewayModule,
    forwardRef(() => ElasticModule),
  ],
  providers: [
    ProtocolService,
  ],
  exports: [
    ProtocolService,
  ],
})
export class ProtocolModule { }
