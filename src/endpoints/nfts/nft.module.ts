import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { NftController } from "./nft.controller";
import { NftExtendedAttributesService } from "./nft.extendedattributes.service";
import { NftService } from "./nft.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  controllers: [
    NftController,
  ],
  providers: [
    NftService, NftExtendedAttributesService
  ],
  exports: [
    NftService, NftExtendedAttributesService
  ]
})
export class NftModule { }