import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQlModule } from "src/common/graphql/graphql.module";
import { MexSettingsService } from "./mex.settings.service";

@Module({
  imports: [
    ConfigModule,
    GraphQlModule,
  ],
  providers: [
    MexSettingsService,
  ],
  exports: [
    MexSettingsService,
  ],
})
export class MexSettingsModule { }
