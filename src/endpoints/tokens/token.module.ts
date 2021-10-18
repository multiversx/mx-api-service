import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { TokenAssetService } from "./token.asset.service";
import { TokenController } from "./token.controller";
import { TokenService } from "./token.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  controllers: [
    TokenController,
  ],
  providers: [
    TokenAssetService, TokenService
  ],
  exports: [
    TokenAssetService, TokenService
  ]
})
export class TokenModule { }