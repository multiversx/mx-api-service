import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
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
    forwardRef(() => CollectionModule)
  ],
  providers: [
    NftService, NftExtendedAttributesService
  ],
  exports: [
    NftService, NftExtendedAttributesService
  ]
})
export class NftModule { }