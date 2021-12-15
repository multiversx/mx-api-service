import { Module } from "@nestjs/common";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { PluginModule } from "src/plugins/plugin.module";
import { NftModule } from "../nfts/nft.module";
import { GenerateThumbnailService } from "./generate.service";

@Module({
  imports: [
    ApiConfigModule,
    PluginModule,
    NftModule,
  ],
  providers: [
    GenerateThumbnailService,
  ],
  exports: [
    GenerateThumbnailService,
  ]
})
export class GenerateThumbnailModule { }