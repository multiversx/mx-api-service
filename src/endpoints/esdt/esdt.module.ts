import { forwardRef, Module } from "@nestjs/common";
import { VmQueryModule } from "src/endpoints/vm.query/vm.query.module";
import { EsdtService } from "./esdt.service";
import { TokenModule } from "../tokens/token.module";
import { EsdtAddressService } from "./esdt.address.service";
import { NftModule } from "../nfts/nft.module";
import { CollectionModule } from "../collections/collection.module";
import { TransactionModule } from "../transactions/transaction.module";
import { MexModule } from "../mex/mex.module";
import { AssetsModule } from "src/common/assets/assets.module";


@Module({
  imports: [
    forwardRef(() => NftModule),
    forwardRef(() => CollectionModule),
    forwardRef(() => TokenModule),
    VmQueryModule,
    forwardRef(() => TransactionModule),
    forwardRef(() => MexModule.forRoot()),
    forwardRef(() => AssetsModule),
  ],
  providers: [
    EsdtService, EsdtAddressService,
  ],
  exports: [
    EsdtService, EsdtAddressService,
  ],
})
export class EsdtModule { }
