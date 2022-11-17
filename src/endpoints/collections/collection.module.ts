import { forwardRef, Module } from "@nestjs/common";
import { AssetsModule } from "src/common/assets/assets.module";
import { PluginModule } from "src/plugins/plugin.module";
import { EsdtModule } from "../esdt/esdt.module";
import { MarketplaceModule } from "../marketplace/marketplace.module";
import { TokenModule } from "../tokens/token.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { CollectionService } from "./collection.service";

@Module({
  imports: [
    forwardRef(() => EsdtModule),
    forwardRef(() => VmQueryModule),
    forwardRef(() => TokenModule),
    forwardRef(() => AssetsModule),
    forwardRef(() => PluginModule),
    forwardRef(() => MarketplaceModule),
  ],
  providers: [
    CollectionService,
  ],
  exports: [
    CollectionService,
  ],
})
export class CollectionModule { }
