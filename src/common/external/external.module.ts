import { forwardRef, Module } from "@nestjs/common";
import { DataApiModule } from "./data.api.module";
import { ExtrasApiModule } from "./extras.api.module";

@Module({
  imports: [
    forwardRef(() => DataApiModule),
    forwardRef(() => ExtrasApiModule),
  ],
  exports: [
    DataApiModule,
    ExtrasApiModule,
  ]
})
export class ExternalModule { }