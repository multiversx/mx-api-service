import { forwardRef, Module } from "@nestjs/common";
import { EsdtModule } from "../esdt/esdt.module";
import { NftModule } from "../nfts/nft.module";
import { TransactionModule } from "../transactions/transaction.module";
import { TokenService } from "./token.service";
import { TokenTransferService } from "./token.transfer.service";
import { AssetsModule } from "src/common/assets/assets.module";
import { MexModule } from "../mex/mex.module";
import { CollectionModule } from "../collections/collection.module";

@Module({
  imports: [
    forwardRef(() => EsdtModule),
    forwardRef(() => NftModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => AssetsModule),
    forwardRef(() => MexModule),
    forwardRef(() => CollectionModule),
  ],
  providers: [
    TokenService, TokenTransferService,
  ],
  exports: [
    TokenService, TokenTransferService,
  ],
})
export class TokenModule { }
