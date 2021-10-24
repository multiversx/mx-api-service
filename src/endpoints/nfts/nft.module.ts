import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { EsdtModule } from "../esdt/esdt.module";
import { NftExtendedAttributesService } from "./nft.extendedattributes.service";
import { NftService } from "./nft.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    EsdtModule,
  ],
  providers: [
    NftService, NftExtendedAttributesService
  ],
  exports: [
    NftService, NftExtendedAttributesService
  ]
})
export class NftModule { }