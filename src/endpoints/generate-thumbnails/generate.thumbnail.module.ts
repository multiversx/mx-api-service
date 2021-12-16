import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { NftWorkerModule } from "src/queues/nft.worker/nft.worker.module";
import { NftModule } from "../nfts/nft.module";
import { GenerateThumbnailService } from "./generate.thumbnail.service";

@Module({
  imports: [
    ApiConfigModule,
    NftWorkerModule,
    forwardRef(() => NftModule),
  ],
  providers: [
    GenerateThumbnailService,
  ],
  exports: [
    GenerateThumbnailService,
  ]
})
export class GenerateThumbnailModule { }