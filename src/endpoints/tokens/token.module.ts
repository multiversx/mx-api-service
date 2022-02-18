import { forwardRef, Module } from "@nestjs/common";
import { EsdtModule } from "../esdt/esdt.module";
import { NftModule } from "../nfts/nft.module";
import { TransactionModule } from "../transactions/transaction.module";
import { TokenAssetService } from "./token.asset.service";
import { TokenService } from "./token.service";
import { TokenTransferService } from "./token.transfer.service";

@Module({
  imports: [
    forwardRef(() => EsdtModule),
    forwardRef(() => NftModule),
    forwardRef(() => TransactionModule),
  ],
  providers: [
    TokenAssetService, TokenService, TokenTransferService,
  ],
  exports: [
    TokenAssetService, TokenService, TokenTransferService,
  ],
})
export class TokenModule { }
