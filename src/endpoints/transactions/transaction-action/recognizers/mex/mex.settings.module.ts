import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MexSettingsService } from "./mex.settings.service";

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    MexSettingsService,
  ],
  exports: [
    MexSettingsService,
  ],
})
export class MexSettingsModule { }
