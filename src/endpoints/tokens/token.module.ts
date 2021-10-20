import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { TokenAssetService } from "./token.asset.service";
import { TokenService } from "./token.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  providers: [
    TokenAssetService, TokenService
  ],
  exports: [
    TokenAssetService, TokenService
  ]
})
export class TokenModule { }