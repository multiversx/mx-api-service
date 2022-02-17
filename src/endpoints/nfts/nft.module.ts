import { forwardRef, Module } from "@nestjs/common";
import { PluginModule } from "src/plugins/plugin.module";
import { NftMediaModule } from "src/queue.worker/nft.worker/queue/job-services/media/nft.media.module";
import { NftMetadataModule } from "src/queue.worker/nft.worker/queue/job-services/metadata/nft.metadata.module";
import { CollectionModule } from "../collections/collection.module";
import { EsdtModule } from "../esdt/esdt.module";
import { TokenModule } from "../tokens/token.module";
import { NftExtendedAttributesService } from "./nft.extendedattributes.service";
import { NftService } from "./nft.service";

@Module({
  imports: [
    forwardRef(() => EsdtModule),
    forwardRef(() => TokenModule),
    forwardRef(() => CollectionModule),
    forwardRef(() => PluginModule),
    forwardRef(() => NftMetadataModule),
    forwardRef(() => NftMediaModule),
  ],
  providers: [
    NftService, NftExtendedAttributesService,
  ],
  exports: [
    NftService, NftExtendedAttributesService,
  ],
})
export class NftModule { }
