import { Global, Module } from "@nestjs/common";
import { ApiConfigModule } from "../api-config/api.config.module";
import { SettingsService } from "./settings.service";

@Global()
@Module({
  imports: [
    ApiConfigModule,
  ],
  providers: [
    SettingsService,
  ],
  exports: [
    SettingsService,
  ],
})
export class SettingsModule { }
