import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "config/configuration";
import { ApiConfigService } from "./api.config.service";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [
    ApiConfigService,
  ],
  exports: [
    ApiConfigService,
  ],
})
export class ApiConfigModule { }
