import { forwardRef, Module } from "@nestjs/common";
import { AssetsModule } from "src/common/assets/assets.module";
import { EsdtModule } from "../esdt/esdt.module";
import { TokenModule } from "../tokens/token.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { CollectionService } from "./collection.service";

@Module({
  imports: [
    forwardRef(() => EsdtModule),
    forwardRef(() => VmQueryModule),
    forwardRef(() => TokenModule),
    forwardRef(() => AssetsModule),
  ],
  providers: [
    CollectionService,
  ],
  exports: [
    CollectionService,
  ],
})
export class CollectionModule { }
