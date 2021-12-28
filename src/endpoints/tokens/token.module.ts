import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { EsdtModule } from "../esdt/esdt.module";
import { NftModule } from "../nfts/nft.module";
import { TokenAssetService } from "./token.asset.service";
import { TokenService } from "./token.service";
import { TokenTransferService } from "./token.transfer.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => EsdtModule),
    forwardRef(() => NftModule),
  ],
  providers: [
    TokenAssetService, TokenService, TokenTransferService
  ],
  exports: [
    TokenAssetService, TokenService, TokenTransferService
  ]
})
export class TokenModule { }