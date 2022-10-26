import { Global, Module } from "@nestjs/common";
import { ApiConfigModule } from "../api-config/api.config.module";
import { PersistenceModule } from "../persistence/persistence.module";
import { SettingsService } from "./settings.service";

@Global()
@Module({
  imports: [
    ApiConfigModule,
    PersistenceModule,
  ],
  providers: [
    SettingsService,
  ],
  exports: [
    SettingsService,
  ],
})
export class SettingsModule { }
