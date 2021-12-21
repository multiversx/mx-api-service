import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { NftWorkerModule } from "src/queue.worker/nft.worker/nft.worker.module";
import { NftModule } from "../nfts/nft.module";
import { ProcessNftsService } from "./process.nfts.service";

@Module({
  imports: [
    ApiConfigModule,
    NftWorkerModule,
    forwardRef(() => NftModule),
  ],
  providers: [
    ProcessNftsService,
  ],
  exports: [
    ProcessNftsService,
  ]
})
export class ProcessNftsModule { }