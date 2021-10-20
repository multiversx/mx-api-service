import { Module } from "@nestjs/common";
import { ApiModule } from "./api.module";
import { DataApiModule } from "./data.api.module";
import { ElasticModule } from "./elastic.module";
import { ExtrasApiModule } from "./extras-api.module";
import { GatewayModule } from "./gateway.module";

@Module({
  imports: [
    ApiModule,
    DataApiModule,
    ElasticModule,
    ExtrasApiModule,
    GatewayModule
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