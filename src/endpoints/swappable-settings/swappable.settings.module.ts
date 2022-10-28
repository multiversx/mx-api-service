import { Module } from "@nestjs/common";
import { SwappableSettingsService } from "./swappable.settings.service";

@Module({
  imports: [],
  providers: [
    SwappableSettingsService,
  ],
  exports: [
    SwappableSettingsService,
  ],
})
export class SwappableSettingsModule { }
