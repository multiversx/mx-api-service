import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GraphQlService } from "src/common/graphql/graphql.service";

@Module({
  providers: [GraphQlService, ApiConfigService, ConfigService],
  exports: [GraphQlService],
})
export class RootTestModule { }
