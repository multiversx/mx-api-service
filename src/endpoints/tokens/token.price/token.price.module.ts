import { forwardRef } from "@nestjs/common";

import { Module } from "@nestjs/common";
import { TokenPriceService } from "./token.price.service";
import { ApiModule } from "@multiversx/sdk-nestjs-http";
import { MetricsModule } from "@multiversx/sdk-nestjs-monitoring";
import { EsdtModule } from "src/endpoints/esdt/esdt.module";
import { DataApiModule } from "src/common/data-api/data-api.module";
import { MexModule } from "src/endpoints/mex/mex.module";
@Module({
  imports: [
    forwardRef(() => ApiModule),
    forwardRef(() => MexModule.forRoot()),
    forwardRef(() => EsdtModule),
    forwardRef(() => DataApiModule),
    forwardRef(() => MetricsModule),
  ],
  providers: [
    TokenPriceService,
  ],
  exports: [
    TokenPriceService,
  ],
})
export class TokenPriceModule { }
