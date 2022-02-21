import { forwardRef, Module } from "@nestjs/common";
import { KeybaseModule } from "src/common/keybase/keybase.module";
import { NodeModule } from "../nodes/node.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { ProviderService } from "./provider.service";

@Module({
  imports: [
    forwardRef(() => KeybaseModule),
    forwardRef(() => NodeModule),
    VmQueryModule,
  ],
  providers: [
    ProviderService,
  ],
  exports: [
    ProviderService,
  ],
})
export class ProviderModule { }
