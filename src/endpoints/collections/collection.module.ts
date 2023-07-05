import { forwardRef, Module } from "@nestjs/common";
import { AssetsModule } from "src/common/assets/assets.module";
import { PluginModule } from "src/plugins/plugin.module";
import { EsdtModule } from "../esdt/esdt.module";
import { NftMarketplaceModule } from "../marketplace/nft.marketplace.module";
import { TokenModule } from "../tokens/token.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { CollectionService } from "./collection.service";
import { EsdtContractAddressModule } from "../vm.query/contracts/esdt.contract.address.module";

@Module({
  imports: [
    forwardRef(() => EsdtModule),
    forwardRef(() => VmQueryModule),
    forwardRef(() => TokenModule),
    forwardRef(() => AssetsModule),
    forwardRef(() => PluginModule),
    forwardRef(() => NftMarketplaceModule),
    forwardRef(() => EsdtContractAddressModule),
  ],
  providers: [
    CollectionService,
  ],
  exports: [
    CollectionService,
  ],
})
export class CollectionModule { }
