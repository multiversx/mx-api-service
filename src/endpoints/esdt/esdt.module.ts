import { forwardRef, Module } from "@nestjs/common";
import { VmQueryModule } from "src/endpoints/vm.query/vm.query.module";
import { EsdtService } from "./esdt.service";
import { TokenModule } from "../tokens/token.module";
import { EsdtAddressService } from "./esdt.address.service";
import { NftModule } from "../nfts/nft.module";
import { CollectionModule } from "../collections/collection.module";


@Module({
  imports: [
    NftModule,
    forwardRef(() => CollectionModule),
    forwardRef(() => TokenModule),
    VmQueryModule,
  ],
  providers: [
    EsdtService, EsdtAddressService,
  ],
  exports: [
    EsdtService, EsdtAddressService,
  ],
})
export class EsdtModule { }
