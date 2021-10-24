import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "../api-config/api.config.module";
import { ApiModule } from "../network/api.module";
import { ExtrasApiService } from "./extras.api.service";


@Module({
  imports: [
    ApiConfigModule,
    forwardRef(() => ApiModule),
  ],
  providers: [
    ExtrasApiService
  ],
  exports: [
    ExtrasApiService
  ]
})
export class ExtrasApiModule { }