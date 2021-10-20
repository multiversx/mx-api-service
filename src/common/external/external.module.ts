import { forwardRef, Module } from "@nestjs/common";
import { ApiModule } from "../network/api.module";
import { DataApiModule } from "./data.api.module";
import { ElasticModule } from "../elastic/elastic.module";
import { ExtrasApiModule } from "./extras.api.module";
import { GatewayModule } from "../gateway/gateway.module";

@Module({
  imports: [
    forwardRef(() => ApiModule),
    forwardRef(() => DataApiModule),
    forwardRef(() => ElasticModule),
    forwardRef(() => ExtrasApiModule),
    forwardRef(() => GatewayModule)
  ],
  exports: [
    ApiModule,
    DataApiModule,
    ElasticModule,
    ExtrasApiModule,
    GatewayModule
  ]
})
export class ExternalModule { }