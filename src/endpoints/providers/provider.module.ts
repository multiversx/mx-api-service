import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { NodeModule } from "../nodes/node.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { ProviderController } from "./provider.controller";
import { ProviderService } from "./provider.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => NodeModule),
    forwardRef(() => VmQueryModule),
  ],
  controllers: [
    ProviderController,
  ],
  providers: [
    ProviderService,
  ],
  exports: [
    ProviderService,
  ]
})
export class ProviderModule { }