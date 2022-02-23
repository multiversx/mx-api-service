import { forwardRef, Module } from "@nestjs/common";
import { EsdtModule } from "../esdt/esdt.module";
import { TokenModule } from "../tokens/token.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { CollectionService } from "./collection.service";

@Module({
  imports: [
    forwardRef(() => EsdtModule),
    forwardRef(() => VmQueryModule),
    forwardRef(() => TokenModule),
  ],
  providers: [
    CollectionService,
  ],
  exports: [
    CollectionService,
  ],
})
export class CollectionModule { }
