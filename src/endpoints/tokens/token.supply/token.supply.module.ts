import { Module, forwardRef } from "@nestjs/common";
import { TokenSupplyService } from "./token.supply.service";
import { EsdtModule } from "../../esdt/esdt.module";

@Module({
  imports: [
    forwardRef(() => EsdtModule),
  ],
  providers: [
    TokenSupplyService,
  ],
  exports: [
    TokenSupplyService,
  ],
})
export class TokenSupplyModule { }
