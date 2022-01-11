import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { EsdtModule } from "../esdt/esdt.module";
import { TokenModule } from "../tokens/token.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { CollectionService } from "./collection.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    EsdtModule,
    VmQueryModule,
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