import { forwardRef, Module } from "@nestjs/common";
import { VmQueryModule } from "src/endpoints/vm.query/vm.query.module";
import { EsdtService } from "./esdt.service";
import { TokenModule } from "../tokens/token.module";


@Module({
  imports: [
    forwardRef(() => TokenModule),
    VmQueryModule,
  ],
  providers: [
    EsdtService,
  ],
  exports: [
    EsdtService,
  ],
})
export class EsdtModule { }
