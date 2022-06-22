import { Module } from "@nestjs/common";
import { AssetsService } from "../../common/assets/assets.service";
import { ApiConfigModule } from "../api-config/api.config.module";
import { CachingModule } from "../caching/caching.module";

@Module({
  imports: [
    CachingModule,
    ApiConfigModule,
  ],
  providers: [
    AssetsService,
  ],
  exports: [
    AssetsService,
  ],
})
export class AssetsModule { }
