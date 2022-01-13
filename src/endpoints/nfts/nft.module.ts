import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { PersistenceModule } from "src/common/persistence/persistence.module";
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
    forwardRef(() => CommonModule),
    forwardRef(() => EsdtModule),
    forwardRef(() => TokenModule),
    forwardRef(() => CollectionModule),
    forwardRef(() => PluginModule),
    forwardRef(() => NftMetadataModule),
    forwardRef(() => NftMediaModule),
    forwardRef(() => PersistenceModule),
  ],
  providers: [
    NftService, NftExtendedAttributesService,
  ],
  exports: [
    NftService, NftExtendedAttributesService,
  ],
})
export class NftModule { }