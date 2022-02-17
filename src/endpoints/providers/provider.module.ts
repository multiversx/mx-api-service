import { forwardRef, Module } from "@nestjs/common";
import { NodeModule } from "../nodes/node.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { ProviderService } from "./provider.service";

@Module({
  imports: [
    forwardRef(() => NodeModule),
    forwardRef(() => VmQueryModule),
  ],
  providers: [
    ProviderService,
  ],
  exports: [
    ProviderService,
  ],
})
export class ProviderModule { }
