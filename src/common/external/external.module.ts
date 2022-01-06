import { forwardRef, Module } from "@nestjs/common";
import { DataApiModule } from "./data.api.module";

@Module({
  imports: [
    forwardRef(() => DataApiModule),
  ],
  exports: [
    DataApiModule,
  ],
})
export class ExternalModule { }