import { Module } from "@nestjs/common";
import { TokenModule as InternalTokenModule } from "src/endpoints/tokens/token.module";
import { TokenResolver } from "./tokens.resolver";

@Module({
  imports: [InternalTokenModule],
  providers: [TokenResolver],
})
export class TokenModule { }
